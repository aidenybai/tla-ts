\* Static semantics (§8) over engine262's parse nodes. A missing child is None, and a list of
\* nodes is a sequence. Names are sequences of code units.
Has(x) == x # None
List(x) == IF x = None THEN <<>> ELSE x
ConcatMap(seq, F(_)) == FoldLeftSeq([i \in DOMAIN seq |-> F(seq[i])])

FunctionDeclarationTypes ==
  {"FunctionDeclaration", "GeneratorDeclaration", "AsyncFunctionDeclaration", "AsyncGeneratorDeclaration"}
LexicalDeclarationTypes == {"ClassDeclaration", "LexicalDeclaration", "UsingDeclaration", "AwaitUsingDeclaration"}

BoundNames(n) ==
  CASE n.type = "BindingIdentifier" -> <<n.name>>
    [] n.type \in {"LexicalDeclaration", "UsingDeclaration", "AwaitUsingDeclaration"} -> BoundNamesList(n.BindingList)
    [] n.type \in {"LexicalBinding", "VariableDeclaration", "ForBinding", "BindingRestElement"} ->
         IF Has(n.BindingIdentifier) THEN BoundNames(n.BindingIdentifier) ELSE BoundNames(n.BindingPattern)
    [] n.type = "VariableStatement" -> BoundNamesList(n.VariableDeclarationList)
    [] n.type = "ForDeclaration" -> BoundNames(n.ForBinding)
    [] n.type \in FunctionDeclarationTypes \cup {"ClassDeclaration"} ->
         IF Has(n.BindingIdentifier) THEN BoundNames(n.BindingIdentifier) ELSE <<N("*default*")>>
    [] n.type = "SingleNameBinding" -> BoundNames(n.BindingIdentifier)
    \* The ExportDeclaration that LexicallyScopedDeclarations gives for export default with an
    \* expression.
    [] n.type = "ExportDeclaration" -> <<N("*default*")>>
    [] n.type = "BindingRestProperty" -> BoundNames(n.BindingIdentifier)
    [] n.type = "BindingElement" -> BoundNames(n.BindingPattern)
    [] n.type = "BindingProperty" -> BoundNames(n.BindingElement)
    [] n.type = "ObjectBindingPattern" ->
         BoundNamesList(n.BindingPropertyList) \o
         (IF Has(n.BindingRestProperty) THEN BoundNames(n.BindingRestProperty) ELSE <<>>)
    [] n.type = "ArrayBindingPattern" ->
         BoundNamesList(n.BindingElementList) \o
         (IF Has(n.BindingRestElement) THEN BoundNames(n.BindingRestElement) ELSE <<>>)
    [] OTHER -> <<>>
BoundNamesList(list) == ConcatMap(List(list), BoundNames)

VarDeclaredNames(n) ==
  CASE n.type = "VariableStatement" -> BoundNamesList(n.VariableDeclarationList)
    [] n.type = "VariableDeclaration" -> BoundNames(n)
    [] n.type = "IfStatement" ->
         VarDeclaredNames(n.Statement_a) \o (IF Has(n.Statement_b) THEN VarDeclaredNames(n.Statement_b) ELSE <<>>)
    [] n.type = "Block" -> VarDeclaredNamesList(n.StatementList)
    [] n.type \in {"WhileStatement", "DoWhileStatement", "WithStatement"} -> VarDeclaredNames(n.Statement)
    [] n.type = "ForStatement" ->
         VarDeclaredNamesList(n.VariableDeclarationList) \o VarDeclaredNames(n.Statement)
    [] n.type \in {"ForInStatement", "ForOfStatement", "ForAwaitStatement"} ->
         (IF Has(n.ForBinding) THEN BoundNames(n.ForBinding) ELSE <<>>) \o VarDeclaredNames(n.Statement)
    [] n.type = "SwitchStatement" -> VarDeclaredNames(n.CaseBlock)
    [] n.type = "CaseBlock" ->
         VarDeclaredNamesList(n.CaseClauses_a) \o
         (IF Has(n.DefaultClause) THEN VarDeclaredNames(n.DefaultClause) ELSE <<>>) \o
         VarDeclaredNamesList(n.CaseClauses_b)
    [] n.type \in {"CaseClause", "DefaultClause"} -> VarDeclaredNamesList(n.StatementList)
    [] n.type = "LabelledStatement" -> VarDeclaredNames(n.LabelledItem)
    [] n.type = "TryStatement" ->
         VarDeclaredNames(n.Block) \o
         (IF Has(n.Catch) THEN VarDeclaredNames(n.Catch) ELSE <<>>) \o
         (IF Has(n.Finally) THEN VarDeclaredNames(n.Finally) ELSE <<>>)
    [] n.type = "Catch" -> VarDeclaredNames(n.Block)
    [] n.type = "Script" -> IF Has(n.ScriptBody) THEN VarDeclaredNames(n.ScriptBody) ELSE <<>>
    [] n.type = "ScriptBody" -> TopLevelVarDeclaredNamesList(n.StatementList)
    [] n.type \in {"FunctionBody", "GeneratorBody", "AsyncBody", "AsyncGeneratorBody"} ->
         TopLevelVarDeclaredNamesList(n.FunctionStatementList)
    [] n.type = "ClassStaticBlockBody" -> TopLevelVarDeclaredNamesList(n.ClassStaticBlockStatementList)
    [] n.type = "ExportDeclaration" ->
         IF Has(n.VariableStatement) THEN BoundNames(n.VariableStatement) ELSE <<>>
    [] OTHER -> <<>>
VarDeclaredNamesList(list) == ConcatMap(List(list), VarDeclaredNames)

TopLevelVarDeclaredNames(n) ==
  CASE n.type \in LexicalDeclarationTypes -> <<>>
    [] n.type \in FunctionDeclarationTypes -> BoundNames(n)
    [] n.type = "LabelledStatement" -> TopLevelVarDeclaredNames(n.LabelledItem)
    [] OTHER -> VarDeclaredNames(n)
TopLevelVarDeclaredNamesList(list) == ConcatMap(List(list), TopLevelVarDeclaredNames)

VarScopedDeclarations(n) ==
  CASE n.type = "VariableStatement" -> VarScopedDeclarationsList(n.VariableDeclarationList)
    [] n.type = "VariableDeclaration" -> <<n>>
    [] n.type = "Block" -> VarScopedDeclarationsList(n.StatementList)
    [] n.type = "IfStatement" ->
         VarScopedDeclarations(n.Statement_a) \o
         (IF Has(n.Statement_b) THEN VarScopedDeclarations(n.Statement_b) ELSE <<>>)
    [] n.type \in {"WhileStatement", "DoWhileStatement", "WithStatement"} -> VarScopedDeclarations(n.Statement)
    [] n.type = "ForStatement" ->
         VarScopedDeclarationsList(n.VariableDeclarationList) \o VarScopedDeclarations(n.Statement)
    [] n.type \in {"ForInStatement", "ForOfStatement", "ForAwaitStatement"} ->
         (IF Has(n.ForBinding) THEN <<n.ForBinding>> ELSE <<>>) \o VarScopedDeclarations(n.Statement)
    [] n.type = "SwitchStatement" -> VarScopedDeclarations(n.CaseBlock)
    [] n.type = "CaseBlock" ->
         VarScopedDeclarationsList(n.CaseClauses_a) \o
         (IF Has(n.DefaultClause) THEN VarScopedDeclarations(n.DefaultClause) ELSE <<>>) \o
         VarScopedDeclarationsList(n.CaseClauses_b)
    [] n.type \in {"CaseClause", "DefaultClause"} -> VarScopedDeclarationsList(n.StatementList)
    [] n.type = "LabelledStatement" -> VarScopedDeclarations(n.LabelledItem)
    [] n.type = "TryStatement" ->
         VarScopedDeclarations(n.Block) \o
         (IF Has(n.Catch) THEN VarScopedDeclarations(n.Catch) ELSE <<>>) \o
         (IF Has(n.Finally) THEN VarScopedDeclarations(n.Finally) ELSE <<>>)
    [] n.type = "Catch" -> VarScopedDeclarations(n.Block)
    [] n.type = "ExportDeclaration" ->
         IF Has(n.VariableStatement) THEN VarScopedDeclarations(n.VariableStatement) ELSE <<>>
    [] n.type = "Script" -> IF Has(n.ScriptBody) THEN VarScopedDeclarations(n.ScriptBody) ELSE <<>>
    [] n.type = "ScriptBody" -> TopLevelVarScopedDeclarationsList(n.StatementList)
    [] n.type = "Module" -> IF Has(n.ModuleBody) THEN VarScopedDeclarations(n.ModuleBody) ELSE <<>>
    [] n.type = "ModuleBody" -> VarScopedDeclarationsList(n.ModuleItemList)
    [] n.type \in {"FunctionBody", "GeneratorBody", "AsyncBody", "AsyncGeneratorBody"} ->
         TopLevelVarScopedDeclarationsList(n.FunctionStatementList)
    [] n.type = "ClassStaticBlockBody" -> TopLevelVarScopedDeclarationsList(n.ClassStaticBlockStatementList)
    [] OTHER -> <<>>
VarScopedDeclarationsList(list) == ConcatMap(List(list), VarScopedDeclarations)

\* §B.3.2: the FunctionDeclarations directly in a Block, CaseClause, or DefaultClause of a script or
\* function body that a var statement with their name could replace without an early error, so no
\* scope around them in the body declares the name lexically.
HoistableFunctions(code) ==
  LET list == CASE code.type = "Script" -> IF Has(code.ScriptBody) THEN List(code.ScriptBody.StatementList) ELSE <<>>
                [] OTHER -> List(code.FunctionStatementList)
      blocked == Range(LexicallyDeclaredNames(code))
  IN ConcatMap(list, LAMBDA item : HoistableIn(item, blocked))
\* The hoistable functions in statement n, around which the scopes declare the names blocked.
HoistableIn(n, blocked) ==
  CASE n.type = "Block" -> HoistableInList(List(n.StatementList), blocked)
    [] n.type = "IfStatement" ->
         HoistableIn(n.Statement_a, blocked) \o (IF Has(n.Statement_b) THEN HoistableIn(n.Statement_b, blocked) ELSE <<>>)
    [] n.type \in {"WhileStatement", "DoWhileStatement", "WithStatement"} -> HoistableIn(n.Statement, blocked)
    [] n.type = "LabelledStatement" -> HoistableIn(n.LabelledItem, blocked)
    [] n.type = "ForStatement" ->
         HoistableIn(n.Statement, IF Has(n.LexicalDeclaration) THEN blocked \cup Range(BoundNames(n.LexicalDeclaration)) ELSE blocked)
    [] n.type \in {"ForInStatement", "ForOfStatement", "ForAwaitStatement"} ->
         HoistableIn(n.Statement, IF Has(n.ForDeclaration) THEN blocked \cup Range(BoundNames(n.ForDeclaration)) ELSE blocked)
    [] n.type = "SwitchStatement" ->
         HoistableInList(ConcatMap(List(n.CaseBlock.CaseClauses_a) \o
                                   (IF Has(n.CaseBlock.DefaultClause) THEN <<n.CaseBlock.DefaultClause>> ELSE <<>>) \o
                                   List(n.CaseBlock.CaseClauses_b), LAMBDA clause : List(clause.StatementList)), blocked)
    [] n.type = "TryStatement" ->
         HoistableIn(n.Block, blocked) \o
         (IF Has(n.Catch) THEN HoistableIn(n.Catch, blocked) ELSE <<>>) \o
         (IF Has(n.Finally) THEN HoistableIn(n.Finally, blocked) ELSE <<>>)
    \* §B.3.4: a var may repeat a catch parameter that is a lone identifier.
    [] n.type = "Catch" ->
         HoistableIn(n.Block, IF Has(n.CatchParameter) /\ n.CatchParameter.type # "BindingIdentifier"
                              THEN blocked \cup Range(BoundNames(n.CatchParameter)) ELSE blocked)
    [] OTHER -> <<>>
\* The hoistable functions in a block's statements: those whose name nothing else in the block or
\* around it declares lexically, and those deeper in.
HoistableInList(items, blocked) ==
  LET names == ConcatMap(LexicallyScopedDeclarationsList(items), BoundNames)
  IN ConcatMap(items, LAMBDA item :
       IF item.type # "FunctionDeclaration" THEN HoistableIn(item, blocked \cup Range(names))
       ELSE IF item.BindingIdentifier.name \notin blocked /\
               Len(SelectSeq(names, LAMBDA name : name = item.BindingIdentifier.name)) = 1
       THEN <<item>> ELSE <<>>)

TopLevelVarScopedDeclarations(n) ==
  CASE n.type \in LexicalDeclarationTypes -> <<>>
    [] n.type \in FunctionDeclarationTypes -> <<n>>
    [] n.type = "LabelledStatement" -> TopLevelVarScopedDeclarations(n.LabelledItem)
    [] OTHER -> VarScopedDeclarations(n)
TopLevelVarScopedDeclarationsList(list) == ConcatMap(List(list), TopLevelVarScopedDeclarations)

LexicallyScopedDeclarations(n) ==
  CASE n.type = "LabelledStatement" -> LexicallyScopedDeclarations(n.LabelledItem)
    [] n.type = "Script" -> IF Has(n.ScriptBody) THEN LexicallyScopedDeclarations(n.ScriptBody) ELSE <<>>
    [] n.type = "ScriptBody" -> TopLevelLexicallyScopedDeclarationsList(n.StatementList)
    [] n.type = "Module" -> IF Has(n.ModuleBody) THEN LexicallyScopedDeclarations(n.ModuleBody) ELSE <<>>
    [] n.type = "ModuleBody" -> LexicallyScopedDeclarationsList(n.ModuleItemList)
    [] n.type \in {"FunctionBody", "GeneratorBody", "AsyncBody", "AsyncGeneratorBody"} ->
         TopLevelLexicallyScopedDeclarationsList(n.FunctionStatementList)
    [] n.type = "ClassStaticBlockBody" ->
         TopLevelLexicallyScopedDeclarationsList(n.ClassStaticBlockStatementList)
    [] n.type = "ImportDeclaration" -> <<>>
    [] n.type \in LexicalDeclarationTypes \cup FunctionDeclarationTypes -> <<n>>
    [] n.type = "CaseBlock" ->
         LexicallyScopedDeclarationsList(n.CaseClauses_a) \o
         (IF Has(n.DefaultClause) THEN LexicallyScopedDeclarations(n.DefaultClause) ELSE <<>>) \o
         LexicallyScopedDeclarationsList(n.CaseClauses_b)
    [] n.type \in {"CaseClause", "DefaultClause"} -> LexicallyScopedDeclarationsList(n.StatementList)
    [] n.type = "ExportDeclaration" ->
         CASE Has(n.Declaration) -> <<n.Declaration>>
           [] Has(n.HoistableDeclaration) -> <<n.HoistableDeclaration>>
           [] Has(n.ClassDeclaration) -> <<n.ClassDeclaration>>
           [] Has(n.AssignmentExpression) -> <<n>>
           [] OTHER -> <<>>
    [] OTHER -> <<>>
LexicallyScopedDeclarationsList(list) == ConcatMap(List(list), LexicallyScopedDeclarations)

TopLevelLexicallyScopedDeclarations(n) ==
  IF n.type \in LexicalDeclarationTypes THEN <<n>>
  ELSE IF n.type = "LabelledStatement" THEN <<>>
  ELSE <<>>
TopLevelLexicallyScopedDeclarationsList(list) == ConcatMap(List(list), TopLevelLexicallyScopedDeclarations)

TopLevelLexicallyDeclaredNames(n) == IF n.type \in LexicalDeclarationTypes THEN BoundNames(n) ELSE <<>>
TopLevelLexicallyDeclaredNamesList(list) == ConcatMap(List(list), TopLevelLexicallyDeclaredNames)

LexicallyDeclaredNames(n) ==
  CASE n.type = "Script" -> IF Has(n.ScriptBody) THEN LexicallyDeclaredNames(n.ScriptBody) ELSE <<>>
    [] n.type = "ScriptBody" -> TopLevelLexicallyDeclaredNamesList(n.StatementList)
    [] n.type \in {"FunctionBody", "GeneratorBody", "AsyncBody", "AsyncGeneratorBody"} ->
         TopLevelLexicallyDeclaredNamesList(n.FunctionStatementList)
    [] n.type = "ClassStaticBlockBody" -> TopLevelLexicallyDeclaredNamesList(n.ClassStaticBlockStatementList)
    [] OTHER -> <<>>

\* The lexically scoped declarations directly in a block or a case block.
BlockDeclarations(list) == LexicallyScopedDeclarationsList(list)

IsConstantDeclaration(n) ==
  (n.type = "LexicalDeclaration" /\ n.LetOrConst = "const") \/
  n.type \in {"UsingDeclaration", "AwaitUsingDeclaration"} \/
  (n.type = "ForDeclaration" /\ (n.production # "LetOrConst" \/ n.LetOrConst = "const"))

IsSimpleParameterList(list) ==
  \A i \in DOMAIN list : list[i].type = "SingleNameBinding" /\ ~Has(list[i].Initializer)

HasInitializer(n) == "Initializer" \in DOMAIN n /\ Has(n.Initializer)

ContainsExpression(n) ==
  CASE n.type = "SingleNameBinding" -> Has(n.Initializer)
    [] n.type = "BindingElement" -> ContainsExpression(n.BindingPattern) \/ Has(n.Initializer)
    [] n.type = "ObjectBindingPattern" ->
         ContainsExpressionList(n.BindingPropertyList) \/
         (Has(n.BindingRestProperty) /\ ContainsExpression(n.BindingRestProperty))
    [] n.type = "BindingProperty" ->
         (Has(n.PropertyName) /\ n.PropertyName.type = "PropertyName") \/
         ContainsExpression(n.BindingElement)
    [] n.type \in {"BindingRestProperty", "BindingRestElement"} ->
         ~Has(n.BindingIdentifier) /\ ContainsExpression(n.BindingPattern)
    [] n.type = "ArrayBindingPattern" ->
         ContainsExpressionList(n.BindingElementList) \/
         (Has(n.BindingRestElement) /\ ContainsExpression(n.BindingRestElement))
    [] OTHER -> FALSE
ContainsExpressionList(list) == \E i \in DOMAIN List(list) : ContainsExpression(list[i])

ExpectedArgumentCount(list) ==
  LET firstDefault == {i \in DOMAIN list : list[i].type = "BindingRestElement" \/ HasInitializer(list[i])}
  IN IF firstDefault = {} THEN Len(list) ELSE (CHOOSE i \in firstDefault : \A j \in firstDefault : i <= j) - 1

IsFunctionDefinition(n) ==
  IF n.type = "ParenthesizedExpression" THEN IsFunctionDefinition(n.Expression)
  ELSE n.type \in {"FunctionExpression", "GeneratorExpression", "AsyncGeneratorExpression",
                   "AsyncFunctionExpression", "ClassExpression", "ArrowFunction", "AsyncArrowFunction"}

HasName(n) ==
  IF n.type = "ParenthesizedExpression" THEN HasName(n.Expression)
  ELSE n.type \notin {"ArrowFunction", "AsyncArrowFunction"} /\ Has(n.BindingIdentifier)

IsAnonymousFunctionDefinition(n) == IsFunctionDefinition(n) /\ ~HasName(n)

IsIdentifierRef(n) == n.type = "IdentifierReference"

\* PropName (§8.6.5) of a property name node, or Empty when it is computed.
PropName(n) ==
  CASE n.type = "IdentifierName" -> n.name
    [] n.type = "StringLiteral" -> n.value
    [] n.type = "NumericLiteral" -> NumToString(n.value)
    [] OTHER -> Empty
