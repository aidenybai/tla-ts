\* Modules (§16.2): Source Text Module Records, JSON, text and bytes modules as Synthetic Module Records
\* (§16.2.1.8), module namespace objects (§10.4.6), import() (§13.3.10), and import.meta
\* (§13.3.12). The state's modules holds the module records by index, and moduleIds maps a realm
\* and the host's name for each module it loaded in that realm to the index. A module record has:
\*   kind              "source", or "synthetic" for a JSON, text or bytes module, whose value is its
\*                     default export
\*   moduleSource      its [[ModuleSource]] object of the source-phase-imports proposal, or Empty
\*   node              a source module's Module parse node
\*   status            "new", "unlinked", "linking", "linked", "evaluating", "evaluating-async", or
\*                     "evaluated"
\*   error             the value its evaluation threw, or Empty
\*   requests          its ModuleRequest Records [specifier, attributes], with attributes a function
\*                     from keys to values, and loaded, which maps each to a module index
\*   phases            [request, phase] for each import or export from, with phase "evaluation",
\*                     "defer", or "source"
\*   env, cycleRoot    indices, 0 when empty
\*   namespace, deferredNamespace, meta, capability   Empty until made
\*   asyncOrder        0 when unset, -1 when done, or the order of its async evaluation
\*   imports, localExports, indirectExports, starExports   its entries (§16.2.1.7)
\* An import entry is [request, isNamespace, isSource, importName, localName], with isDeferred too
\* for a namespace import, a local export entry
\* [exportName, localName], an indirect one [exportName, request, isNamespace, isDeferred, isSource,
\* importName], and a star one [request]. isSource marks a source phase import, which binds its
\* module's source, or the export of one.
ModuleAt(s, m) == s.modules[m]
SetModule(s, m, fields) == [s EXCEPT !.modules[m] = fields @@ @]
Lesser(a, b) == IF a < b THEN a ELSE b

\* StringValue of a ModuleExportName, an ImportedBinding, or a ModuleSpecifier.
StringValueOf(n) == IF n.type = "StringLiteral" THEN n.value ELSE n.name

NoAttributes == [key \in {} |-> <<>>]
\* WithClauseToAttributes (§16.2.2.4), as a function from keys to values.
Attributes(clause) ==
  LET entries == IF Has(clause) THEN Range(clause.WithEntries) ELSE {}
  IN [key \in {StringValueOf(e.AttributeKey) : e \in entries} |->
        (CHOOSE e \in entries : StringValueOf(e.AttributeKey) = key).AttributeValue.value]
ModuleRequest(n) ==
  [specifier |-> StringValueOf(IF n.type = "ImportDeclaration" /\ ~Has(n.FromClause) THEN n.ModuleSpecifier ELSE n.FromClause),
   attributes |-> Attributes(n.WithClause)]

\* The phase of each module request, as the import-defer and source-phase-imports proposals add.
ModuleRequestPhases(node) ==
  Dedupe(ConcatMap(ModuleItems(node), LAMBDA item :
    IF item.type = "ImportDeclaration" \/ (item.type = "ExportDeclaration" /\ Has(item.FromClause))
    THEN <<[request |-> ModuleRequest(item), phase |-> IF item.type = "ImportDeclaration" THEN item.Phase ELSE "evaluation"]>>
    ELSE <<>>))

ModuleItems(node) == IF Has(node.ModuleBody) THEN List(node.ModuleBody.ModuleItemList) ELSE <<>>

\* ModuleRequests (§16.2.1.4).
ModuleRequests(node) ==
  Dedupe(ConcatMap(ModuleItems(node), LAMBDA item :
    IF item.type = "ImportDeclaration" \/ (item.type = "ExportDeclaration" /\ Has(item.FromClause))
    THEN <<ModuleRequest(item)>> ELSE <<>>))

\* ImportEntries (§16.2.2.2) and ImportEntriesForModule (§16.2.2.3).
ImportEntries(node) ==
  ConcatMap(ModuleItems(node), LAMBDA item :
    CASE item.type # "ImportDeclaration" -> <<>>
      [] Has(item.ImportClause) -> ImportClauseEntries(item.ImportClause, ModuleRequest(item), item.Phase)
      [] Has(item.ImportedBinding) ->
           <<[request |-> ModuleRequest(item), isNamespace |-> FALSE, isSource |-> TRUE, importName |-> <<>>,
              localName |-> item.ImportedBinding.name]>>
      [] OTHER -> <<>>)
ImportClauseEntries(clause, request, phase) ==
  (IF Has(clause.ImportedDefaultBinding)
   THEN <<[request |-> request, isNamespace |-> FALSE, isSource |-> FALSE, importName |-> N("default"),
           localName |-> clause.ImportedDefaultBinding.ImportedBinding.name]>>
   ELSE <<>>) \o
  (IF Has(clause.NameSpaceImport)
   THEN <<[request |-> request, isNamespace |-> TRUE, isSource |-> FALSE, isDeferred |-> phase = "defer", importName |-> <<>>,
           localName |-> clause.NameSpaceImport.ImportedBinding.name]>>
   ELSE <<>>) \o
  (IF Has(clause.NamedImports)
   THEN MapSeq(List(clause.NamedImports.ImportsList), LAMBDA spec :
          [request |-> request, isNamespace |-> FALSE, isSource |-> FALSE,
           importName |-> StringValueOf(IF Has(spec.ModuleExportName) THEN spec.ModuleExportName ELSE spec.ImportedBinding),
           localName |-> spec.ImportedBinding.name])
   ELSE <<>>)

\* ExportEntries (§16.2.3.4) and ExportEntriesForModule (§16.2.3.5), with form "local" for an
\* entry without a module request, and otherwise "name", "namespace", or "star" for
\* all-but-default.
ExportEntry(exportName, request, form, importName, localName) ==
  [exportName |-> exportName, request |-> request, form |-> form, importName |-> importName, localName |-> localName]
LocalExport(exportName, localName) == ExportEntry(exportName, Empty, "local", <<>>, localName)
ExportEntries(node) ==
  ConcatMap(ModuleItems(node), LAMBDA item : IF item.type = "ExportDeclaration" THEN ExportDeclarationEntries(item) ELSE <<>>)
ExportDeclarationEntries(n) ==
  CASE Has(n.FromClause) ->
         LET request == ModuleRequest(n)
             clause == n.ExportFromClause
         IN CASE clause.type = "NamedExports" ->
                   MapSeq(List(clause.ExportsList), LAMBDA spec :
                     ExportEntry(StringValueOf(spec.exportName), request, "name", StringValueOf(spec.localName), <<>>))
              [] Has(clause.ModuleExportName) -> <<ExportEntry(StringValueOf(clause.ModuleExportName), request, "namespace", <<>>, <<>>)>>
              [] OTHER -> <<ExportEntry(<<>>, request, "star", <<>>, <<>>)>>
    [] Has(n.NamedExports) ->
         MapSeq(List(n.NamedExports.ExportsList), LAMBDA spec : LocalExport(StringValueOf(spec.exportName), StringValueOf(spec.localName)))
    [] Has(n.VariableStatement) -> MapSeq(BoundNames(n.VariableStatement), LAMBDA name : LocalExport(name, name))
    [] Has(n.Declaration) -> MapSeq(BoundNames(n.Declaration), LAMBDA name : LocalExport(name, name))
    [] Has(n.HoistableDeclaration) -> <<LocalExport(N("default"), BoundNames(n.HoistableDeclaration)[1])>>
    [] Has(n.ClassDeclaration) -> <<LocalExport(N("default"), BoundNames(n.ClassDeclaration)[1])>>
    [] OTHER -> <<LocalExport(N("default"), N("*default*"))>>

\* ParseModule (§16.2.1.7.1) once the host parsed node, and CreateDefaultExportSyntheticModule
\* (§16.2.1.8.1) for a synthetic module.
ModuleRecord(kind, node, value, requests, phases, hasTLA, imports, localExports, indirectExports, starExports) ==
  [kind |-> kind, node |-> node, value |-> value, status |-> "new", error |-> Empty, requests |-> requests,
   phases |-> phases, loaded |-> <<>>, env |-> 0, cycleRoot |-> 0, namespace |-> Empty,
   deferredNamespace |-> Empty, meta |-> Empty, capability |-> Empty,
   moduleSource |-> Empty, hasTLA |-> hasTLA, asyncOrder |-> 0, asyncParents |-> <<>>, pendingAsync |-> 0, dfsAncestorIndex |-> 0,
   imports |-> imports, localExports |-> localExports, indirectExports |-> indirectExports, starExports |-> starExports]
SourceTextModule(node) ==
  LET imports == ImportEntries(node)
      importedNames == {e.localName : e \in Range(imports)}
      exports == ExportEntries(node)
      ImportOf(name) == CHOOSE e \in Range(imports) : e.localName = name
  IN ModuleRecord("source", node, Undefined, ModuleRequests(node), ModuleRequestPhases(node), node.hasTopLevelAwait, imports,
       ConcatMap(exports, LAMBDA e :
         IF e.form = "local" /\ e.localName \notin importedNames THEN <<[exportName |-> e.exportName, localName |-> e.localName]>>
         ELSE <<>>),
       ConcatMap(exports, LAMBDA e :
         CASE e.form = "local" /\ e.localName \in importedNames ->
                <<[exportName |-> e.exportName, request |-> ImportOf(e.localName).request,
                   isNamespace |-> ImportOf(e.localName).isNamespace,
                   isDeferred |-> ImportOf(e.localName).isNamespace /\ ImportOf(e.localName).isDeferred,
                   isSource |-> ImportOf(e.localName).isSource, importName |-> ImportOf(e.localName).importName]>>
           [] e.form \in {"name", "namespace"} ->
                <<[exportName |-> e.exportName, request |-> e.request, isNamespace |-> e.form = "namespace", isDeferred |-> FALSE,
                   isSource |-> FALSE, importName |-> e.importName]>>
           [] OTHER -> <<>>),
       ConcatMap(exports, LAMBDA e : IF e.form = "star" THEN <<[request |-> e.request]>> ELSE <<>>))

\* HostLoadImportedModule (§16.2.1.10) for the test262 host, which loads the files beside the
\* test: the module for request, made the first time the host loads it. The state's parses takes
\* [goal |-> "module", directory, specifier, type] to [ok |-> FALSE, error], with error the name
\* of the error to throw, or to [ok |-> TRUE, id, type, node, source], with id the host's name for
\* the module, type the request's type, and source the code units of a JSON or text module or the
\* bytes of a bytes module. A bytes module's value is a Uint8Array over an immutable ArrayBuffer
\* (CreateBytesModule of proposal-import-bytes). The type "source" is test262's '<module source>',
\* a module with no exports whose [[ModuleSource]] inherits from %AbstractModuleSource.prototype%
\* through a host-defined prototype.
HostLoadModule(s, request) ==
  LET key == [goal |-> "module", directory |-> s.directory, specifier |-> request.specifier,
              type |-> IF N("type") \in DOMAIN request.attributes THEN request.attributes[N("type")] ELSE <<>>]
      loaded == s.parses[key]
  IN IF ~loaded.ok THEN ThrowError(s, loaded.error)
  ELSE IF <<s.realmId, loaded.id>> \in DOMAIN s.moduleIds THEN Ok(s, s.moduleIds[<<s.realmId, loaded.id>>])
  ELSE LET value == CASE loaded.type = N("json") -> JSONParse(s, Str(loaded.source), Undefined)
                      [] loaded.type = N("text") -> Ok(s, Str(loaded.source))
                      [] loaded.type = N("bytes") ->
                           LET buffer == AllocateImmutableArrayBuffer(s, NumFromInt(Len(loaded.source)), loaded.source)
                           IN IF IsAbrupt(buffer) THEN buffer
                              ELSE Construct(buffer.s, Intrinsic(buffer.s, "Uint8Array"), <<Val(buffer)>>, Intrinsic(buffer.s, "Uint8Array"))
                      [] OTHER -> Ok(s, Undefined) IN
  IF IsAbrupt(value) THEN value ELSE
  LET proto == Alloc(value.s, MakeObject(Intrinsic(value.s, "AbstractModuleSourcePrototype"), "ordinary", [none |-> TRUE]))
      source == Alloc(proto.s, MakeObject(proto.v, "ordinary", [moduleSourceClassName |-> N("ModuleSource")]))
      synthetic == ModuleRecord("synthetic", None, Val(value), <<>>, <<>>, FALSE, <<>>, <<>>, <<>>, <<>>)
      record == CASE loaded.type = <<>> -> SourceTextModule(loaded.node)
                  [] loaded.type = N("source") -> [synthetic EXCEPT !.moduleSource = source.v]
                  [] OTHER -> synthetic
      s1 == IF loaded.type = N("source") THEN source.s ELSE value.s
      m == Len(s1.modules) + 1
  IN Ok([s1 EXCEPT !.modules = Append(@, record), !.moduleIds = (<<s.realmId, loaded.id>> :> m) @@ @], m)

\* LoadRequestedModules (§16.2.1.6.1.1, §16.2.1.8.4.1), returning the promise. The loading state is
\* [loading, pending, visited, capability], and the host loads each module at once.
LoadRequestedModules(s, m) ==
  IF ModuleAt(s, m).kind = "synthetic" THEN PromiseResolve(s, Intrinsic(s, "Promise"), Undefined) ELSE
  LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
      r == InnerModuleLoading(cap.s, [loading |-> TRUE, pending |-> 1, visited |-> <<>>, capability |-> Val(cap)], m)
  IN Ok(r.s, Val(cap).promise)

\* InnerModuleLoading (§16.2.1.6.1.1.1), returning [s, state].
InnerModuleLoading(s, state, m) ==
  LET rec == ModuleAt(s, m)
      loaded == IF rec.kind = "source" /\ rec.status = "new" /\ m \notin Range(state.visited)
                THEN LoadRequests(s, [state EXCEPT !.visited = Append(@, m), !.pending = @ + Len(rec.requests)], m, rec.requests)
                ELSE [s |-> s, state |-> state]
      left == [loaded.state EXCEPT !.pending = @ - 1]
  IN IF ~loaded.state.loading THEN loaded
     ELSE IF left.pending # 0 THEN [s |-> loaded.s, state |-> left]
     ELSE LET resolved == Call(MarkUnlinked(loaded.s, left.visited), left.capability.resolve, Undefined, <<Undefined>>)
          IN [s |-> resolved.s, state |-> [left EXCEPT !.loading = FALSE]]
LoadRequests(s, state, m, requests) ==
  IF requests = <<>> \/ ~state.loading THEN [s |-> s, state |-> state] ELSE
  LET request == Head(requests)
      next == CASE ~(DOMAIN request.attributes \subseteq {N("type")}) ->
                     LET e == ThrowError(s, "SyntaxError") IN ContinueModuleLoading(e.s, state, e)
                [] request \in DOMAIN ModuleAt(s, m).loaded -> InnerModuleLoading(s, state, ModuleAt(s, m).loaded[request])
                [] OTHER -> FinishLoadingImportedModule(m, request, state, HostLoadModule(s, request))
  IN LoadRequests(next.s, next.state, m, Tail(requests))
MarkUnlinked(s, visited) ==
  IF visited = <<>> THEN s
  ELSE MarkUnlinked(IF ModuleAt(s, Head(visited)).status = "new" THEN SetModule(s, Head(visited), [status |-> "unlinked"]) ELSE s,
                    Tail(visited))

\* FinishLoadingImportedModule (§16.2.1.11) for a static import, with r the host's completion.
FinishLoadingImportedModule(referrer, request, state, r) ==
  ContinueModuleLoading(IF ~IsAbrupt(r) /\ request \notin DOMAIN ModuleAt(r.s, referrer).loaded
                        THEN SetModule(r.s, referrer, [loaded |-> (request :> Val(r)) @@ ModuleAt(r.s, referrer).loaded])
                        ELSE r.s,
                        state, r)
\* ContinueModuleLoading (§16.2.1.6.1.1.2).
ContinueModuleLoading(s, state, r) ==
  IF ~state.loading THEN [s |-> s, state |-> state]
  ELSE IF ~IsAbrupt(r) THEN InnerModuleLoading(s, state, Val(r))
  ELSE LET rejected == Call(s, state.capability.reject, Undefined, <<r.c.value>>)
       IN [s |-> rejected.s, state |-> [state EXCEPT !.loading = FALSE]]

\* GetExportedNames (§16.2.1.7.2.1, §16.2.1.8.4.2), returning [names, set] with set the
\* exportStarSet the search grew.
GetExportedNames(s, m, starSet) ==
  LET rec == ModuleAt(s, m) IN
  CASE rec.kind = "synthetic" -> [names |-> <<N("default")>>, set |-> starSet]
    [] m \in starSet -> [names |-> <<>>, set |-> starSet]
    [] OTHER -> StarExportedNames(s, m, rec.starExports,
                                  MapSeq(rec.localExports, LAMBDA e : e.exportName) \o
                                  MapSeq(rec.indirectExports, LAMBDA e : e.exportName),
                                  starSet \cup {m})
StarExportedNames(s, m, stars, names, starSet) ==
  IF stars = <<>> THEN [names |-> names, set |-> starSet] ELSE
  LET star == GetExportedNames(s, ModuleAt(s, m).loaded[Head(stars).request], starSet)
  IN StarExportedNames(s, m, Tail(stars), AppendNewNames(names, star.names), star.set)
AppendNewNames(names, more) ==
  IF more = <<>> THEN names
  ELSE AppendNewNames(IF Head(more) = N("default") \/ Head(more) \in Range(names) THEN names ELSE Append(names, Head(more)),
                      Tail(more))

\* ResolveExport (§16.2.1.7.2.2, §16.2.1.8.4.3), returning [result, set] with set the resolveSet
\* the search grew. A result is a ResolvedBinding Record [kind |-> "binding", module, name,
\* namespace, deferred, source], with source for the module's source as the binding, or
\* [kind |-> "null"] or [kind |-> "ambiguous"].
NoResolution == [kind |-> "null"]
Resolved(m, name, isNamespace, isDeferred) ==
  [kind |-> "binding", module |-> m, name |-> name, namespace |-> isNamespace, deferred |-> isDeferred, source |-> FALSE]
ResolveExport(s, m, name, resolveSet) ==
  LET rec == ModuleAt(s, m)
      set == resolveSet \cup {<<m, name>>}
      local == SelectSeq(rec.localExports, LAMBDA e : e.exportName = name)
      indirect == SelectSeq(rec.indirectExports, LAMBDA e : e.exportName = name)
  IN CASE rec.kind = "synthetic" ->
            [result |-> IF name = N("default") THEN Resolved(m, name, FALSE, FALSE) ELSE NoResolution, set |-> resolveSet]
       [] <<m, name>> \in resolveSet -> [result |-> NoResolution, set |-> resolveSet]
       [] local # <<>> -> [result |-> Resolved(m, local[1].localName, FALSE, FALSE), set |-> set]
       [] indirect # <<>> /\ indirect[1].isNamespace ->
            [result |-> Resolved(rec.loaded[indirect[1].request], <<>>, TRUE, indirect[1].isDeferred), set |-> set]
       [] indirect # <<>> /\ indirect[1].isSource ->
            [result |-> [Resolved(rec.loaded[indirect[1].request], <<>>, FALSE, FALSE) EXCEPT !.source = TRUE], set |-> set]
       [] indirect # <<>> -> ResolveExport(s, rec.loaded[indirect[1].request], indirect[1].importName, set)
       [] name = N("default") -> [result |-> NoResolution, set |-> set]
       [] OTHER -> ResolveStarExport(s, m, name, rec.starExports, NoResolution, set)
ResolveStarExport(s, m, name, stars, star, set) ==
  IF stars = <<>> THEN [result |-> star, set |-> set] ELSE
  LET r == ResolveExport(s, ModuleAt(s, m).loaded[Head(stars).request], name, set) IN
  CASE r.result.kind = "ambiguous" -> r
    [] r.result.kind = "null" -> ResolveStarExport(s, m, name, Tail(stars), star, r.set)
    [] star.kind = "null" -> ResolveStarExport(s, m, name, Tail(stars), r.result, r.set)
    [] r.result # star -> [result |-> [kind |-> "ambiguous"], set |-> r.set]
    [] OTHER -> ResolveStarExport(s, m, name, Tail(stars), star, r.set)
\* GetModuleSource of the source-phase-imports proposal.
GetModuleSource(s, m) ==
  IF ModuleAt(s, m).moduleSource = Empty THEN ThrowError(s, "SyntaxError") ELSE Ok(s, ModuleAt(s, m).moduleSource)
IsResolvable(s, m, name) == ResolveExport(s, m, name, {}).result.kind = "binding"

\* GetModuleNamespace (§16.2.1.13) with ModuleNamespaceCreate (§10.4.6.12), for the evaluation phase
\* or, when isDeferred, the defer phase of the import-defer proposal.
GetModuleNamespace(s, m, isDeferred) ==
  LET field == IF isDeferred THEN "deferredNamespace" ELSE "namespace" IN
  IF ModuleAt(s, m)[field] # Empty THEN Ok(s, ModuleAt(s, m)[field]) ELSE
  LET names == SelectSeq(GetExportedNames(s, m, {}).names, LAMBDA name : IsResolvable(s, m, name))
      object == MakeObject(Null, "namespace", [module |-> m, exports |-> SortCodeUnits(Range(names)), deferred |-> isDeferred])
      tag == IF isDeferred THEN SV("Deferred Module") ELSE SV("Module")
      ns == Alloc(s, PutProp([object EXCEPT !.ext = FALSE], SymToStringTag, DataDesc(tag, FALSE, FALSE, FALSE)))
  IN Ok(SetModule(ns.s, m, [name \in {field} |-> ns.v]), ns.v)
SortCodeUnits(names) ==
  IF names = {} THEN <<>>
  ELSE LET first == CHOOSE name \in names : \A other \in names : name = other \/ CodeUnitLess(name, other)
       IN <<first>> \o SortCodeUnits(names \ {first})

\* Module namespace exotic objects (§10.4.6), with slots [module, exports, deferred]. A deferred
\* namespace evaluates its module before it reads the exports, except for a symbol-like key: a
\* symbol, or "then" (IsSymbolLikeNamespaceKey and GetModuleExportsList of import-defer).
IsSymbolLikeNamespaceKey(s, v, k) == IsSymbol(k) \/ (Slots(s, v).deferred /\ k.value = N("then"))
NamespaceExports(s, v) ==
  IF ~Slots(s, v).deferred THEN Ok(s, Range(Slots(s, v).exports)) ELSE
  LET evaluated == EvaluateModuleSync(s, Slots(s, v).module) IN
  IF IsAbrupt(evaluated) THEN evaluated ELSE Ok(evaluated.s, Range(Slots(s, v).exports))
NamespaceHasProperty(s, v, k) ==
  LET exports == NamespaceExports(s, v) IN IF IsAbrupt(exports) THEN exports ELSE Ok(exports.s, Bool(k.value \in Val(exports)))
NamespaceDelete(s, v, k) ==
  LET exports == NamespaceExports(s, v) IN IF IsAbrupt(exports) THEN exports ELSE Ok(exports.s, Bool(k.value \notin Val(exports)))
NamespaceGet(s, v, k) ==
  LET exports == NamespaceExports(s, v) IN
  IF IsAbrupt(exports) THEN exports
  ELSE IF k.value \notin Val(exports) THEN Ok(exports.s, Undefined) ELSE
  LET binding == ResolveExport(exports.s, Slots(s, v).module, k.value, {}).result IN
  IF binding.namespace THEN GetModuleNamespace(exports.s, binding.module, binding.deferred)
  ELSE IF binding.source THEN GetModuleSource(exports.s, binding.module)
  ELSE IF ModuleAt(exports.s, binding.module).env = 0 THEN ThrowError(exports.s, "ReferenceError")
  ELSE GetBindingValue(exports.s, ModuleAt(exports.s, binding.module).env, binding.name, TRUE)
NamespaceGetOwnProperty(s, v, k) ==
  IF IsSymbolLikeNamespaceKey(s, v, k) THEN Ok(s, OrdinaryGetOwnProperty(O(s, v), k)) ELSE
  LET exports == NamespaceExports(s, v) IN
  IF IsAbrupt(exports) THEN exports
  ELSE IF k.value \notin Val(exports) THEN Ok(exports.s, Absent)
  ELSE LET value == NamespaceGet(exports.s, v, k) IN
       IF IsAbrupt(value) THEN value ELSE Ok(value.s, DataDesc(Val(value), TRUE, TRUE, FALSE))
NamespaceDefineOwnProperty(s, v, k, d) ==
  IF IsSymbolLikeNamespaceKey(s, v, k) THEN OrdinaryDefineOwnProperty(s, v, k, d) ELSE
  LET current == NamespaceGetOwnProperty(s, v, k) IN
  CASE IsAbrupt(current) -> current
    [] Val(current) = Absent \/ d.configurable = True \/ d.enumerable = False \/ IsAccessorDescriptor(d) \/
       d.writable = False -> Ok(current.s, False)
    [] d.value # Absent -> Ok(current.s, Bool(SameValue(d.value, Val(current).value)))
    [] OTHER -> Ok(current.s, True)
NamespaceOwnPropertyKeys(s, v) ==
  LET exports == NamespaceExports(s, v)
      names == IF Slots(s, v).deferred THEN SelectSeq(Slots(s, v).exports, LAMBDA name : name # N("then")) ELSE Slots(s, v).exports
  IN IF IsAbrupt(exports) THEN exports ELSE Ok(exports.s, MapSeq(names, Str) \o OwnKeysOf(O(s, v)))

\* EvaluateModuleSync, ReadyForSyncExecution, IsModuleSCCEvaluated, and
\* GatherAsynchronousTransitiveDependencies of the import-defer proposal. ReadyForSyncExecution and
\* GatherAsyncDependencies return [result, seen].
EvaluateModuleSync(s, m) ==
  IF ~ReadyForSyncExecution(s, m, {}).result THEN ThrowTypeError(s) ELSE
  LET promise == ModuleEvaluate(s, m)
      slots == Slots(promise.s, Val(promise))
  IN IF slots.state = "rejected" THEN ThrowValue(SetSlots(promise.s, Val(promise), [isHandled |-> TRUE]), slots.result)
     ELSE Ok(promise.s, Empty)
IsModuleSCCEvaluated(s, m) ==
  ModuleAt(s, IF ModuleAt(s, m).cycleRoot # 0 THEN ModuleAt(s, m).cycleRoot ELSE m).status = "evaluated"
ReadyForSyncExecution(s, m, seen) ==
  LET rec == ModuleAt(s, m) IN
  CASE rec.kind = "synthetic" \/ m \in seen \/ IsModuleSCCEvaluated(s, m) -> [result |-> TRUE, seen |-> seen \cup {m}]
    [] rec.status \in {"evaluating", "evaluating-async"} \/ rec.hasTLA -> [result |-> FALSE, seen |-> seen \cup {m}]
    [] OTHER -> ReadyRequests(s, m, rec.phases, seen \cup {m})
ReadyRequests(s, m, phases, seen) ==
  IF phases = <<>> THEN [result |-> TRUE, seen |-> seen]
  ELSE IF Head(phases).phase = "source" THEN ReadyRequests(s, m, Tail(phases), seen) ELSE
  LET ready == ReadyForSyncExecution(s, ModuleAt(s, m).loaded[Head(phases).request], seen) IN
  IF ready.result THEN ReadyRequests(s, m, Tail(phases), ready.seen) ELSE ready
GatherAsyncDependencies(s, m, seen) ==
  LET rec == ModuleAt(s, m) IN
  CASE m \in seen -> [result |-> <<>>, seen |-> seen]
    [] rec.kind = "synthetic" \/ rec.status = "evaluating" \/ IsModuleSCCEvaluated(s, m) -> [result |-> <<>>, seen |-> seen \cup {m}]
    [] rec.hasTLA -> [result |-> <<m>>, seen |-> seen \cup {m}]
    [] OTHER -> GatherAsyncRequests(s, m, rec.phases, seen \cup {m}, <<>>)
GatherAsyncRequests(s, m, phases, seen, acc) ==
  IF phases = <<>> THEN [result |-> acc, seen |-> seen]
  ELSE IF Head(phases).phase = "source" THEN GatherAsyncRequests(s, m, Tail(phases), seen, acc) ELSE
  LET gathered == GatherAsyncDependencies(s, ModuleAt(s, m).loaded[Head(phases).request], seen)
  IN GatherAsyncRequests(s, m, Tail(phases), gathered.seen, Dedupe(acc \o gathered.result))

\* Link (§16.2.1.6.1.2, §16.2.1.8.4.4). A failed link leaves the modules it was linking unlinked.
ModuleLink(s, m) ==
  IF ModuleAt(s, m).kind = "synthetic" THEN Ok(SyntheticLink(s, m), Empty) ELSE
  LET r == InnerModuleLinking(s, m, <<>>, 0) IN
  IF IsAbrupt(r) THEN Abrupt(SetStatuses(r.s, "linking", [status |-> "unlinked"]), r.c) ELSE Ok(r.s, Empty)
\* The modules with the status from, with fields set. Only the modules on the DFS stack have
\* status "linking" or "evaluating".
SetStatuses(s, from, fields) ==
  LET modules == s.modules IN
  [s EXCEPT !.modules = [m \in DOMAIN modules |->
                           IF modules[m].kind = "source" /\ modules[m].status = from THEN fields @@ modules[m] ELSE modules[m]]]
SyntheticLink(s, m) ==
  LET env == NewModuleEnvironment(s, s.globalEnv, m)
      created == CreateMutableBinding(env.s, env.e, N("default"), FALSE)
  IN SetModule(InitializeBinding(created.s, env.e, N("default"), Undefined).s, m, [env |-> env.e])

\* InnerModuleLinking (§16.2.1.6.1.2.1), returning [stack, index].
InnerModuleLinking(s, m, stack, index) ==
  LET rec == ModuleAt(s, m) IN
  CASE rec.kind = "synthetic" -> Ok(SyntheticLink(s, m), [stack |-> stack, index |-> index])
    [] rec.status \in {"linking", "linked", "evaluating-async", "evaluated"} -> Ok(s, [stack |-> stack, index |-> index])
    [] OTHER ->
         LET r == LinkRequests(SetModule(s, m, [status |-> "linking", dfsAncestorIndex |-> index]), m, rec.requests,
                               Append(stack, m), index + 1)
         IN IF IsAbrupt(r) THEN r ELSE
         LET init == InitializeEnvironment(r.s, m) IN
         IF IsAbrupt(init) THEN init
         ELSE IF ModuleAt(init.s, m).dfsAncestorIndex # index THEN Ok(init.s, Val(r))
         ELSE LET popped == PopComponent(init.s, Val(r).stack, m, FALSE) IN
              Ok(popped.s, [stack |-> popped.stack, index |-> Val(r).index])
LinkRequests(s, m, requests, stack, index) ==
  IF requests = <<>> THEN Ok(s, [stack |-> stack, index |-> index]) ELSE
  LET required == ModuleAt(s, m).loaded[Head(requests)]
      r == InnerModuleLinking(s, required, stack, index)
  IN IF IsAbrupt(r) THEN r
     ELSE LinkRequests(IF ModuleAt(r.s, required).kind = "source" /\ ModuleAt(r.s, required).status = "linking"
                       THEN SetModule(r.s, m, [dfsAncestorIndex |-> Lesser(ModuleAt(r.s, m).dfsAncestorIndex, ModuleAt(r.s, required).dfsAncestorIndex)])
                       ELSE r.s,
                       m, Tail(requests), Val(r).stack, Val(r).index)
\* Pops the stack down to m, the root of a strongly connected component, giving each module its
\* status once linked or evaluated, and, once evaluated, m as its cycle root. Returns [s, stack].
PopComponent(s, stack, m, isEvaluated) ==
  LET top == stack[Len(stack)]
      s1 == IF isEvaluated
            THEN SetModule(s, top, [status |-> IF ModuleAt(s, top).asyncOrder = 0 THEN "evaluated" ELSE "evaluating-async",
                                    cycleRoot |-> m])
            ELSE SetModule(s, top, [status |-> "linked"])
      rest == SubSeq(stack, 1, Len(stack) - 1)
  IN IF top = m THEN [s |-> s1, stack |-> rest] ELSE PopComponent(s1, rest, m, isEvaluated)

\* InitializeEnvironment (§16.2.1.7.3.1).
ModuleContext(env) == Context(env, env, NoPrivateEnvironment, Null)
InitializeEnvironment(s, m) ==
  LET rec == ModuleAt(s, m) IN
  IF \E i \in DOMAIN rec.indirectExports : ~IsResolvable(s, m, rec.indirectExports[i].exportName)
  THEN ThrowError(s, "SyntaxError") ELSE
  LET env == NewModuleEnvironment(s, s.globalEnv, m)
      imported == BindImports(SetModule(env.s, m, [env |-> env.e]), m, env.e, rec.imports)
  IN IF IsAbrupt(imported) THEN imported ELSE
  LET vars == CreateVarBindings(imported.s, env.e, Dedupe(ConcatMap(VarScopedDeclarations(rec.node), BoundNames)), env.e, FALSE, {})
      lexicals == LexicallyScopedDeclarations(rec.node)
  IN Ok(InitializeModuleFunctions(CreateLexicalBindings(vars, env.e, lexicals), ModuleContext(env.e), env.e,
                                  SelectSeq(lexicals, LAMBDA d : d.type \in FunctionDeclarationTypes)),
        Empty)
BindImports(s, m, env, imports) ==
  IF imports = <<>> THEN Ok(s, Empty) ELSE
  LET entry == Head(imports)
      imported == ModuleAt(s, m).loaded[entry.request]
      resolution == ResolveExport(s, imported, entry.importName, {}).result
      isSource == entry.isSource \/ (~entry.isNamespace /\ resolution.source)
      source == GetModuleSource(s, IF entry.isSource THEN imported ELSE resolution.module)
  IN IF ~entry.isSource /\ ~entry.isNamespace /\ resolution.kind # "binding" THEN ThrowError(s, "SyntaxError")
     ELSE IF isSource /\ IsAbrupt(source) THEN source ELSE
     LET bound ==
           IF isSource THEN
             InitializeBinding(CreateImmutableBinding(s, env, entry.localName, TRUE).s, env, entry.localName, Val(source)).s
           ELSE IF entry.isNamespace \/ resolution.namespace THEN
             LET ns == GetModuleNamespace(s, IF entry.isNamespace THEN imported ELSE resolution.module,
                                          IF entry.isNamespace THEN entry.isDeferred ELSE resolution.deferred)
                 created == CreateImmutableBinding(ns.s, env, entry.localName, TRUE)
             IN InitializeBinding(created.s, env, entry.localName, Val(ns)).s
           ELSE CreateImportBinding(s, env, entry.localName, resolution.module, resolution.name)
     IN BindImports(bound, m, env, Tail(imports))
InitializeModuleFunctions(s, ctx, env, fns) ==
  IF fns = <<>> THEN s
  ELSE LET fo == InstantiateFunctionObject(s, ctx, Head(fns)) IN
       InitializeModuleFunctions(InitializeBinding(fo.s, env, BoundNames(Head(fns))[1], Val(fo)).s, ctx, env, Tail(fns))

\* Evaluate (§16.2.1.6.1.3, §16.2.1.8.4.5), returning the promise.
ModuleEvaluate(s, m0) ==
  LET rec0 == ModuleAt(s, m0)
      m == IF rec0.status \in {"evaluating-async", "evaluated"} /\ rec0.cycleRoot # 0 THEN rec0.cycleRoot ELSE m0
  IN IF rec0.kind = "synthetic" THEN
       LET cap == NewPromiseCapability(SyntheticEvaluate(s, m0), Intrinsic(s, "Promise"))
           resolved == Call(cap.s, Val(cap).resolve, Undefined, <<Undefined>>)
       IN Ok(resolved.s, Val(cap).promise)
     ELSE IF ModuleAt(s, m).capability # Empty THEN Ok(s, ModuleAt(s, m).capability.promise) ELSE
     LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
         r == InnerModuleEvaluation(SetModule(cap.s, m, [capability |-> Val(cap)]), m, <<>>, 0)
         settled == CASE IsAbrupt(r) ->
                           Call(SetStatuses(r.s, "evaluating", [status |-> "evaluated", error |-> r.c.value]),
                                Val(cap).reject, Undefined, <<r.c.value>>)
                      [] ModuleAt(r.s, m).status = "evaluated" -> Call(r.s, Val(cap).resolve, Undefined, <<Undefined>>)
                      [] OTHER -> Ok(r.s, Undefined)
     IN Ok(settled.s, Val(cap).promise)
\* The evaluation steps of a JSON module, which set its default export.
SyntheticEvaluate(s, m) == SetMutableBinding(s, ModuleAt(s, m).env, N("default"), ModuleAt(s, m).value, TRUE).s

\* InnerModuleEvaluation (§16.2.1.6.1.3.1), returning [stack, index].
InnerModuleEvaluation(s, m, stack, index) ==
  LET rec == ModuleAt(s, m) IN
  CASE rec.kind = "synthetic" -> Ok(SyntheticEvaluate(s, m), [stack |-> stack, index |-> index])
    [] rec.status \in {"evaluating-async", "evaluated"} ->
         IF rec.error = Empty THEN Ok(s, [stack |-> stack, index |-> index]) ELSE ThrowValue(s, rec.error)
    [] rec.status = "evaluating" -> Ok(s, [stack |-> stack, index |-> index])
    [] OTHER ->
         LET s1 == SetModule(s, m, [status |-> "evaluating", dfsAncestorIndex |-> index, pendingAsync |-> 0])
             r == EvaluateRequests(s1, m, EvaluationList(s1, m, rec.phases, <<>>), Append(stack, m), index + 1)
         IN IF IsAbrupt(r) THEN r ELSE
         LET isAsync == rec.hasTLA \/ ModuleAt(r.s, m).pendingAsync > 0
             ordered == IF isAsync THEN [SetModule(r.s, m, [asyncOrder |-> r.s.asyncCount]) EXCEPT !.asyncCount = @ + 1]
                        ELSE r.s
             executed == CASE ~isAsync -> ExecuteModule(ordered, m)
                           [] ModuleAt(ordered, m).pendingAsync = 0 -> Ok(ExecuteAsyncModule(ordered, m), Empty)
                           [] OTHER -> Ok(ordered, Empty)
         IN IF IsAbrupt(executed) THEN executed
            ELSE IF ModuleAt(executed.s, m).dfsAncestorIndex # index THEN Ok(executed.s, Val(r))
            ELSE LET popped == PopComponent(executed.s, Val(r).stack, m, TRUE) IN
                 Ok(popped.s, [stack |-> popped.stack, index |-> Val(r).index])
\* BuildEvaluationList of the import-defer proposal: the modules a module evaluates first. A
\* deferred request evaluates only the module's asynchronous dependencies, and a source one none.
EvaluationList(s, m, phases, acc) ==
  IF phases = <<>> THEN acc ELSE
  LET required == ModuleAt(s, m).loaded[Head(phases).request]
      more == CASE Head(phases).phase = "source" -> <<>>
                [] Head(phases).phase = "defer" -> GatherAsyncDependencies(s, required, {}).result
                [] OTHER -> <<required>>
  IN EvaluationList(s, m, Tail(phases), Dedupe(acc \o more))
EvaluateRequests(s, m, modules, stack, index) ==
  IF modules = <<>> THEN Ok(s, [stack |-> stack, index |-> index]) ELSE
  LET required == Head(modules)
      r == InnerModuleEvaluation(s, required, stack, index)
      isEvaluating == ModuleAt(r.s, required).status = "evaluating"
      \* The module in the stack, or else the root of its cycle, which evaluated without error.
      target == IF isEvaluating THEN required ELSE ModuleAt(r.s, required).cycleRoot
      lowered == IF isEvaluating
                 THEN SetModule(r.s, m, [dfsAncestorIndex |-> Lesser(ModuleAt(r.s, m).dfsAncestorIndex, ModuleAt(r.s, required).dfsAncestorIndex)])
                 ELSE r.s
      waiting == IF ModuleAt(lowered, target).asyncOrder > 0
                 THEN SetModule(SetModule(lowered, m, [pendingAsync |-> ModuleAt(lowered, m).pendingAsync + 1]),
                                target, [asyncParents |-> Append(ModuleAt(lowered, target).asyncParents, m)])
                 ELSE lowered
  IN CASE IsAbrupt(r) -> r
       [] ModuleAt(r.s, required).kind = "synthetic" -> EvaluateRequests(r.s, m, Tail(modules), Val(r).stack, Val(r).index)
       [] ~isEvaluating /\ ModuleAt(r.s, target).error # Empty -> ThrowValue(r.s, ModuleAt(r.s, target).error)
       [] OTHER -> EvaluateRequests(waiting, m, Tail(modules), Val(r).stack, Val(r).index)

\* ExecuteModule (§16.2.1.7.3.2) for a module without top-level await.
ExecuteModule(s, m) ==
  LET r == EvaluateDisposing(s, ModuleContext(ModuleAt(s, m).env), ModuleItems(ModuleAt(s, m).node)) IN
  IF IsAbrupt(r) THEN r ELSE Ok(r.s, Empty)
\* ExecuteAsyncModule (§16.2.1.6.1.3.2), with ExecuteModule's AsyncBlockStart, returning the state.
ExecuteAsyncModule(s, m) ==
  LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
      onFulfilled == CreateBuiltinFunction(cap.s, <<"Module", "asyncFulfilled">>, 0, <<>>, m)
      onRejected == CreateBuiltinFunction(onFulfilled.s, <<"Module", "asyncRejected">>, 0, <<>>, m)
      then == AddPromiseReactions(onRejected.s, Val(cap).promise, Val(onFulfilled), Val(onRejected), Empty)
  IN AsyncFunctionStep(Val(cap), EvaluateDisposing(then.s, ModuleContext(ModuleAt(s, m).env), ModuleItems(ModuleAt(s, m).node))).s

\* AsyncModuleExecutionFulfilled (§16.2.1.6.1.3.4), returning the state.
AsyncModuleExecutionFulfilled(s, m) ==
  IF ModuleAt(s, m).status = "evaluated" THEN s ELSE
  LET gathered == GatherAvailableAncestors(SettleEvaluated(s, m), m, <<>>)
  IN ExecuteAncestors(gathered.s, SortByAsyncOrder(gathered.s, gathered.list))
\* Marks an async module evaluated, and resolves its top-level capability.
SettleEvaluated(s, m) ==
  LET s1 == SetModule(s, m, [asyncOrder |-> -1, status |-> "evaluated"]) IN
  IF ModuleAt(s1, m).capability = Empty THEN s1 ELSE Call(s1, ModuleAt(s1, m).capability.resolve, Undefined, <<Undefined>>).s
\* GatherAvailableAncestors (§16.2.1.6.1.3.3), returning [s, list].
GatherAvailableAncestors(s, m, list) == GatherFrom(s, ModuleAt(s, m).asyncParents, list)
GatherFrom(s, parents, list) ==
  IF parents = <<>> THEN [s |-> s, list |-> list] ELSE
  LET ancestor == Head(parents)
      s1 == SetModule(s, ancestor, [pendingAsync |-> ModuleAt(s, ancestor).pendingAsync - 1])
      more == CASE ancestor \in Range(list) \/ ModuleAt(s, ModuleAt(s, ancestor).cycleRoot).error # Empty -> [s |-> s, list |-> list]
                [] ModuleAt(s1, ancestor).pendingAsync # 0 -> [s |-> s1, list |-> list]
                [] ModuleAt(s1, ancestor).hasTLA -> [s |-> s1, list |-> Append(list, ancestor)]
                [] OTHER -> GatherAvailableAncestors(s1, ancestor, Append(list, ancestor))
  IN GatherFrom(more.s, Tail(parents), more.list)
SortByAsyncOrder(s, list) ==
  IF list = <<>> THEN <<>>
  ELSE LET first == CHOOSE m \in Range(list) : \A other \in Range(list) : ModuleAt(s, m).asyncOrder <= ModuleAt(s, other).asyncOrder
       IN <<first>> \o SortByAsyncOrder(s, SelectSeq(list, LAMBDA other : other # first))
ExecuteAncestors(s, list) ==
  IF list = <<>> THEN s ELSE
  LET ancestor == Head(list)
      r == ExecuteModule(s, ancestor)
      next == CASE ModuleAt(s, ancestor).status = "evaluated" -> s
                [] ModuleAt(s, ancestor).hasTLA -> ExecuteAsyncModule(s, ancestor)
                [] IsAbrupt(r) -> AsyncModuleExecutionRejected(r.s, ancestor, r.c.value)
                [] OTHER -> SettleEvaluated(r.s, ancestor)
  IN ExecuteAncestors(next, Tail(list))

\* AsyncModuleExecutionRejected (§16.2.1.6.1.3.5), returning the state.
AsyncModuleExecutionRejected(s, m, error) ==
  IF ModuleAt(s, m).status = "evaluated" THEN s ELSE
  LET s1 == SetModule(s, m, [error |-> error, status |-> "evaluated", asyncOrder |-> -1])
      s2 == IF ModuleAt(s1, m).capability = Empty THEN s1 ELSE Call(s1, ModuleAt(s1, m).capability.reject, Undefined, <<error>>).s
  IN RejectAsyncParents(s2, ModuleAt(s2, m).asyncParents, error)
RejectAsyncParents(s, parents, error) ==
  IF parents = <<>> THEN s
  ELSE RejectAsyncParents(AsyncModuleExecutionRejected(s, Head(parents), error), Tail(parents), error)

\* %AbstractModuleSource% of the source-phase-imports proposal, which test262 reaches as
\* $262.AbstractModuleSource. Its @@toStringTag getter returns [[ModuleSourceClassName]].
ModuleIntrinsics ==
  << IntrinsicFunction("AbstractModuleSource", "FunctionPrototype", <<"Module", "abstractModuleSource">>, 0,
                       N("AbstractModuleSource"), TRUE),
     IntrinsicObject("AbstractModuleSourcePrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]) >>

ModuleProperties ==
  Ctor("AbstractModuleSource", "AbstractModuleSourcePrototype") \o
  << G("AbstractModuleSourcePrototype", SymToStringTag, "Module", "abstractModuleSourceTag", ""),
     L("Host262", SV("AbstractModuleSource"), "AbstractModuleSource", TRUE, FALSE, TRUE) >>

\* The AbstractModuleSource built-ins, and the closures of ExecuteAsyncModule and ContinueDynamicImport.
ModuleBuiltin(s, f, m, this, args, nt) ==
  LET data == O(s, f).slots.data IN
  CASE m = "abstractModuleSource" -> ThrowTypeError(s)
    [] m = "abstractModuleSourceTag" ->
         Ok(s, IF IsObject(this) /\ "moduleSourceClassName" \in DOMAIN O(s, this).slots
               THEN Str(O(s, this).slots.moduleSourceClassName) ELSE Undefined)
    [] m = "asyncFulfilled" -> Ok(AsyncModuleExecutionFulfilled(s, data), Undefined)
    [] m = "asyncRejected" -> Ok(AsyncModuleExecutionRejected(s, data, Arg(args, 1)), Undefined)
    [] m = "importRejected" -> ResultThen(Undefined, Call(s, data.reject, Undefined, <<Arg(args, 1)>>))
    [] m = "importLoaded" -> LinkAndEvaluate(s, data)
    [] m = "importEvaluated" -> ResolveImport(s, data)

\* EvaluateImportCall (§13.3.10.2). The test262 host resolves a specifier the same way from any
\* script or module, so the referrer drops out.
EvaluateImportCall(s, ctx, n) == ImportSpecifierThen(ctx, n, EvaluateValue(s, ctx, n.AssignmentExpression))
ImportSpecifierThen(ctx, n, r) ==
  IF IsAbrupt(r) THEN r
  ELSE IF Has(n.OptionsExpression) THEN ImportOptionsThen(n.Phase, Val(r), EvaluateValue(r.s, ctx, n.OptionsExpression))
  ELSE StartImport(r.s, n.Phase, Val(r), Undefined)
ImportOptionsThen(phase, specifier, r) == IF IsAbrupt(r) THEN r ELSE StartImport(r.s, phase, specifier, Val(r))
StartImport(s, phase, specifier, options) ==
  LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise"))
      str == ToStr(cap.s, specifier)
      attributes == ImportAttributesOf(str.s, options)
  IN IF IsAbrupt(str) THEN RejectWith(str, Val(cap))
     ELSE IF IsAbrupt(attributes) THEN RejectWith(attributes, Val(cap))
     ELSE LET continued == ContinueDynamicImport(HostLoadModule(attributes.s, [specifier |-> Val(str).value,
                                                                              attributes |-> Val(attributes)]),
                                                 Val(cap), phase)
          IN Ok(continued.s, Val(cap).promise)
\* Steps 13 and 14 of EvaluateImportCall: the attributes of the options, or a throw completion for
\* the TypeError the promise rejects with.
ImportAttributesOf(s, options) ==
  IF options = Undefined THEN Ok(s, NoAttributes)
  ELSE IF ~IsObject(options) THEN ThrowTypeError(s) ELSE
  LET with == Get(s, options, SV("with")) IN
  IF IsAbrupt(with) \/ Val(with) = Undefined THEN IF IsAbrupt(with) THEN with ELSE Ok(with.s, NoAttributes)
  ELSE IF ~IsObject(Val(with)) THEN ThrowTypeError(with.s) ELSE
  LET entries == EnumerableOwnProperties(with.s, Val(with), "pair")
      pairs == Range(Val(entries))
  IN IF IsAbrupt(entries) THEN entries
     ELSE IF \E pair \in pairs : ~IsString(pair[2]) \/ pair[1].value # N("type") THEN ThrowTypeError(entries.s)
     ELSE Ok(entries.s, [key \in {pair[1].value : pair \in pairs} |-> (CHOOSE pair \in pairs : pair[1].value = key)[2].value])

\* ContinueDynamicImport (§13.3.10.3), returning [s, c]. import.source resolves with the module's
\* [[ModuleSource]] once it loads, or rejects with a SyntaxError if it has none. import.defer, of the import-defer proposal, evaluates only the module's asynchronous
\* dependencies before it resolves with the deferred namespace.
ContinueDynamicImport(r, cap, phase) ==
  IF IsAbrupt(r) THEN Call(r.s, cap.reject, Undefined, <<r.c.value>>)
  ELSE IF phase = "source" THEN
    LET source == GetModuleSource(r.s, Val(r)) IN
    IF IsAbrupt(source) THEN Call(source.s, cap.reject, Undefined, <<source.c.value>>)
    ELSE Call(source.s, cap.resolve, Undefined, <<Val(source)>>)
  ELSE
  LET loading == LoadRequestedModules(r.s, Val(r))
      onRejected == CreateBuiltinFunction(loading.s, <<"Module", "importRejected">>, 1, <<>>, cap)
      linkAndEvaluate == CreateBuiltinFunction(onRejected.s, <<"Module", "importLoaded">>, 0, <<>>,
                                               [module |-> Val(r), capability |-> cap, onRejected |-> Val(onRejected),
                                                isDeferred |-> phase = "defer"])
  IN AddPromiseReactions(linkAndEvaluate.s, Val(loading), Val(linkAndEvaluate), Val(onRejected), Empty)
LinkAndEvaluate(s, data) ==
  LET link == ModuleLink(s, data.module) IN
  IF IsAbrupt(link) THEN ResultThen(Undefined, Call(link.s, data.capability.reject, Undefined, <<link.c.value>>)) ELSE
  LET deps == GatherAsyncDependencies(link.s, data.module, {}).result
      each == EvaluateEach(link.s, deps, <<>>)
      evaluated == IF data.isDeferred THEN SafePromiseAll(each.s, each.promises) ELSE ModuleEvaluate(link.s, data.module)
      onFulfilled == CreateBuiltinFunction(evaluated.s, <<"Module", "importEvaluated">>, 0, <<>>, data)
  IN IF data.isDeferred /\ deps = <<>> THEN ResolveImport(link.s, data)
     ELSE ResultThen(Undefined, AddPromiseReactions(onFulfilled.s, Val(evaluated), Val(onFulfilled), data.onRejected, Empty))
EvaluateEach(s, modules, promises) ==
  IF modules = <<>> THEN [s |-> s, promises |-> promises]
  ELSE LET evaluated == ModuleEvaluate(s, Head(modules)) IN EvaluateEach(evaluated.s, Tail(modules), Append(promises, Val(evaluated)))
ResolveImport(s, data) ==
  LET ns == GetModuleNamespace(s, data.module, data.isDeferred) IN
  ResultThen(Undefined, Call(ns.s, data.capability.resolve, Undefined, <<Val(ns)>>))

\* import.meta (§13.3.12.1), with the host adding no properties. The module is the one whose
\* environment holds the code's.
EvaluateImportMeta(s, ctx, n) ==
  LET m == ActiveModule(s, ctx.lex) IN
  IF ModuleAt(s, m).meta # Empty THEN Ok(s, ModuleAt(s, m).meta) ELSE
  LET meta == OrdinaryObjectCreate(s, Null) IN Ok(SetModule(meta.s, m, [meta |-> Val(meta)]), Val(meta))
ActiveModule(s, e) == IF E(s, e).kind = "module" THEN E(s, e).module ELSE ActiveModule(s, E(s, e).outer)

\* Evaluation of an ExportDeclaration (§16.2.3.7).
EvaluateExportDeclaration(s, ctx, n) ==
  CASE Has(n.VariableStatement) -> EvaluateStatement(s, ctx, n.VariableStatement)
    [] Has(n.Declaration) /\ DecoratorsOf(n) # <<>> ->
         ResultThen(Empty, BindingClassDeclarationEvaluation(s, ctx, n.Declaration, DecoratorsOf(n)))
    [] Has(n.Declaration) -> EvaluateStatement(s, ctx, n.Declaration)
    [] Has(n.ClassDeclaration) ->
         ExportDefaultThen(ctx, Has(n.ClassDeclaration.BindingIdentifier),
                           BindingClassDeclarationEvaluation(s, ctx, n.ClassDeclaration,
                                                             DecoratorsOf(n) \o DecoratorsOf(n.ClassDeclaration)))
    [] Has(n.AssignmentExpression) ->
         ExportDefaultThen(ctx, FALSE, IF IsAnonymousFunctionDefinition(n.AssignmentExpression)
                                       THEN NamedEvaluation(s, ctx, n.AssignmentExpression, SV("default"))
                                       ELSE EvaluateValue(s, ctx, n.AssignmentExpression))
    [] OTHER -> Ok(s, Empty)
\* Binds *default* to the value r gives, unless the class declaration bound its own name.
ExportDefaultThen(ctx, isNamed, r) ==
  IF IsAbrupt(r) \/ isNamed THEN ResultThen(Empty, r)
  ELSE ResultThen(Empty, InitializeBinding(r.s, ctx.lex, N("*default*"), Val(r)))

\* Runs a module test after a harness result: loads the module that specifier names, links it,
\* evaluates it, and runs the jobs, throwing what a rejected promise holds.
RunModule(s, specifier) ==
  LET loaded == HostLoadModule(s, [specifier |-> specifier, attributes |-> NoAttributes])
      loading == LoadRequestedModules(loaded.s, Val(loaded))
  IN IF IsAbrupt(loaded) THEN loaded
     ELSE IF Slots(loading.s, Val(loading)).state = "rejected" THEN ThrowValue(loading.s, Slots(loading.s, Val(loading)).result) ELSE
     LET link == ModuleLink(loading.s, Val(loaded)) IN
     IF IsAbrupt(link) THEN link ELSE
     LET evaluated == ModuleEvaluate(link.s, Val(loaded))
         jobs == RunJobs(evaluated.s)
     IN IF IsAbrupt(jobs) THEN jobs
        ELSE IF Slots(jobs.s, Val(evaluated)).state = "rejected" THEN ThrowValue(jobs.s, Slots(jobs.s, Val(evaluated)).result)
        ELSE jobs
