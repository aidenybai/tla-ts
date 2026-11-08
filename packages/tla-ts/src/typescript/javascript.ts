import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Context, getSymbol } from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import type { Scope } from "./scope";
import { apply, boolean, ifExpression, number, string } from "./tla";

export const JAVASCRIPT_MODULE = `------------------------------ MODULE JavaScript ------------------------------
EXTENDS Integers, Sequences, TLC

CONSTANTS Undefined, Null, Ref

LOCAL Digits == {"-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}

TypeOf(value) ==
  LET text == ToString(value)
      first == SubSeq(text, 1, 1)
  IN CASE value = Undefined -> "undefined"
       [] value = Null -> "object"
       [] text \\in {"TRUE", "FALSE"} -> "boolean"
       [] first = "\\"" -> "string"
       [] \\A i \\in 1..Len(text) : SubSeq(text, i, i) \\in Digits -> "number"
       [] first \\in {"[", "<", "{", "("} \\cup Digits -> "object"
       [] OTHER -> "function"

RelativeIndex(index, length) == IF index < 0 THEN length + index ELSE index

ClampedIndex(index, length) ==
  LET relative == RelativeIndex(index, length)
  IN IF relative < 0 THEN 0 ELSE IF relative > length THEN length ELSE relative

SequenceWith(sequence, index, value) ==
  LET relative == RelativeIndex(index, Len(sequence))
  IN IF relative \\in 0..(Len(sequence) - 1)
     THEN [sequence EXCEPT ![relative + 1] = value]
     ELSE Assert(FALSE, "tla-ts can't throw the RangeError of with()")

IsRef(value) ==
  LET text == ToString(value)
  IN Len(text) >= 7 /\\ SubSeq(text, 1, 7) = "(Ref :>"

IsHeap(ref) == IsRef(ref) /\\ TypeOf(ref[Ref]) = "number"

LOCAL ObjectPrototype == Ref :> "Object.prototype"

LOCAL Inherited == {
  "constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString",
  "toString", "valueOf", "__proto__", "__defineGetter__", "__defineSetter__", "__lookupGetter__",
  "__lookupSetter__"}

LOCAL Writable == [writable |-> TRUE, enumerable |-> TRUE, configurable |-> TRUE]

EmptyObject ==
  [keys |-> <<>>, values |-> <<>>, attributes |-> <<>>, extensible |-> TRUE,
   prototype |-> ObjectPrototype]

WithPrototype(object, value) ==
  CASE value = Null \\/ IsRef(value) -> [object EXCEPT !.prototype = value]
    [] TypeOf(value) \\in {"object", "function"} -> Assert(FALSE, "tla-ts can't make this a prototype")
    [] OTHER -> object

Put(object, key, value) ==
  IF key \\in DOMAIN object.values
  THEN [object EXCEPT !.values = (key :> value) @@ @]
  ELSE [object EXCEPT !.keys = Append(@, key),
                      !.values = (key :> value) @@ @,
                      !.attributes = (key :> Writable) @@ @]

LOCAL IsIndex(key) ==
  /\\ Len(key) > 0
  /\\ \\A position \\in 1..Len(key) : SubSeq(key, position, position) \\in Digits \\ {"-"}
  /\\ Len(key) = 1 \\/ SubSeq(key, 1, 1) # "0"
  /\\ Assert(Len(key) < 10, "tla-ts can't order keys this big")

RECURSIVE ToIndex(_)
ToIndex(key) ==
  IF key = ""
  THEN 0
  ELSE 10 * ToIndex(SubSeq(key, 1, Len(key) - 1))
         + (CHOOSE digit \\in 0..9 : ToString(digit) = SubSeq(key, Len(key), Len(key)))

OwnKeys(object) ==
  SortSeq(SelectSeq(object.keys, IsIndex), LAMBDA left, right : ToIndex(left) < ToIndex(right))
    \\o SelectSeq(object.keys, LAMBDA key : ~IsIndex(key))

LOCAL EnumerableKeys(object) ==
  SelectSeq(OwnKeys(object), LAMBDA key : object.attributes[key].enumerable)

Own(heap, ref) ==
  IF ref \\in {Undefined, Null}
  THEN Assert(FALSE, "tla-ts can't throw the TypeError of reading a property of " \\o ToString(ref))
  ELSE heap[ref[Ref]].values

Enumerable(heap, ref) ==
  LET object == heap[ref[Ref]]
  IN [key \\in {other \\in DOMAIN object.values : object.attributes[other].enumerable}
        |-> object.values[key]]

RECURSIVE PutAll(_, _, _)
PutAll(object, values, keys) ==
  IF keys = <<>>
  THEN object
  ELSE PutAll(Put(object, Head(keys), values[Head(keys)]), values, Tail(keys))

Spread(object, heap, ref) ==
  PutAll(object, Own(heap, ref), EnumerableKeys(heap[ref[Ref]]))

Describe(heap, ref, key) ==
  LET object == heap[ref[Ref]]
      attributes == object.attributes[key]
  IN IF key \\in DOMAIN object.values
     THEN PutAll(EmptyObject,
                 [value |-> object.values[key],
                  writable |-> attributes.writable,
                  enumerable |-> attributes.enumerable,
                  configurable |-> attributes.configurable],
                 <<"value", "writable", "enumerable", "configurable">>)
     ELSE EmptyObject

HasOwn(heap, ref, key) == key \\in DOMAIN Own(heap, ref)

Prototype(heap, ref) == heap[ref[Ref]].prototype

RECURSIVE Has(_, _, _)
Has(heap, ref, key) ==
  LET prototype == Prototype(heap, ref)
  IN CASE key \\in DOMAIN Own(heap, ref) -> TRUE
       [] prototype = Null -> FALSE
       [] IsHeap(prototype) -> Has(heap, prototype, key)
       [] prototype = ObjectPrototype /\\ key \\notin Inherited -> FALSE
       [] OTHER -> Assert(FALSE, "tla-ts can't read what objects inherit")

RECURSIVE Get(_, _, _)
Get(heap, ref, key) ==
  CASE key \\in DOMAIN Own(heap, ref) -> Own(heap, ref)[key]
    [] Has(heap, ref, key) -> Get(heap, Prototype(heap, ref), key)
    [] OTHER -> Undefined

RECURSIVE IsWritable(_, _, _)
IsWritable(heap, ref, key) ==
  LET object == heap[ref[Ref]]
  IN CASE key \\in DOMAIN object.values -> object.attributes[key].writable
       [] object.prototype = Null -> TRUE
       [] IsHeap(object.prototype) -> IsWritable(heap, object.prototype, key)
       [] object.prototype = ObjectPrototype /\\ key \\notin Inherited -> TRUE
       [] OTHER -> Assert(FALSE, "tla-ts can't write what objects inherit")

CanPut(heap, ref, key) ==
  /\\ IsWritable(heap, ref, key)
  /\\ key \\in DOMAIN Own(heap, ref) \\/ heap[ref[Ref]].extensible

RECURSIVE IsPrototypeOf(_, _, _)
IsPrototypeOf(heap, owner, ref) ==
  LET prototype == Prototype(heap, ref)
  IN CASE prototype = Null -> FALSE
       [] ToString(prototype) = ToString(owner) -> TRUE
       [] IsHeap(prototype) -> IsPrototypeOf(heap, owner, prototype)
       [] prototype = ObjectPrototype -> FALSE
       [] OTHER -> Assert(FALSE, "tla-ts can't read what objects inherit")

SetProperty(heap, ref, key, value) ==
  IF CanPut(heap, ref, key)
  THEN [heap EXCEPT ![ref[Ref]] = Put(@, key, value)]
  ELSE Assert(FALSE, "tla-ts can't throw the TypeError of a failed write")

SameValue(left, right) ==
  /\\ TypeOf(left) = TypeOf(right)
  /\\ Assert(TypeOf(left) # "object" \\/ left = Null \\/ right = Null
              \\/ IsRef(left) \\/ IsRef(right),
            "tla-ts can't compare objects by identity")
  /\\ IF IsRef(left) \\/ IsRef(right) THEN ToString(left) = ToString(right) ELSE left = right

ToBoolean(value) ==
  CASE value \\in {Undefined, Null} -> FALSE
    [] TypeOf(value) = "boolean" -> value
    [] TypeOf(value) = "number" -> value # 0
    [] TypeOf(value) = "string" -> value # ""
    [] OTHER -> TRUE

LOCAL Fields == {"value", "writable", "enumerable", "configurable"}

LOCAL ToDescriptor(heap, ref) ==
  IF Has(heap, ref, "get") \\/ Has(heap, ref, "set")
  THEN Assert(FALSE, "tla-ts can't define accessors")
  ELSE [fields |-> {field \\in Fields : Has(heap, ref, field)},
        value |-> Get(heap, ref, "value"),
        writable |-> ToBoolean(Get(heap, ref, "writable")),
        enumerable |-> ToBoolean(Get(heap, ref, "enumerable")),
        configurable |-> ToBoolean(Get(heap, ref, "configurable"))]

LOCAL CanApply(object, key, descriptor) ==
  LET has(field) == field \\in descriptor.fields
      current == object.attributes[key]
  IN IF key \\notin DOMAIN object.values
     THEN object.extensible
     ELSE \\/ current.configurable
          \\/ /\\ ~(has("configurable") /\\ descriptor.configurable)
             /\\ ~(has("enumerable") /\\ descriptor.enumerable # current.enumerable)
             /\\ \\/ current.writable
                \\/ /\\ ~(has("writable") /\\ descriptor.writable)
                   /\\ ~(has("value") /\\ ~SameValue(descriptor.value, object.values[key]))

LOCAL Apply(object, key, descriptor) ==
  LET has(field) == field \\in descriptor.fields
      isNew == key \\notin DOMAIN object.values
      pick(field) ==
        IF has(field) THEN descriptor[field]
        ELSE IF isNew THEN FALSE
        ELSE object.attributes[key][field]
      value ==
        IF has("value") THEN descriptor.value
        ELSE IF isNew THEN Undefined
        ELSE object.values[key]
  IN [object EXCEPT
        !.keys = IF isNew THEN Append(@, key) ELSE @,
        !.values = (key :> value) @@ @,
        !.attributes = (key :> [writable |-> pick("writable"),
                                enumerable |-> pick("enumerable"),
                                configurable |-> pick("configurable")]) @@ @]

RECURSIVE ApplyAll(_, _, _)
ApplyAll(object, keys, descriptors) ==
  IF keys = <<>>
  THEN [object |-> object, isDone |-> TRUE]
  ELSE IF CanApply(object, Head(keys), Head(descriptors))
  THEN ApplyAll(Apply(object, Head(keys), Head(descriptors)), Tail(keys), Tail(descriptors))
  ELSE [object |-> object, isDone |-> FALSE]

DefineProperty(heap, ref, key, descriptor) ==
  IF IsRef(ref) /\\ IsRef(descriptor)
  THEN LET applied == ApplyAll(heap[ref[Ref]], <<key>>, <<ToDescriptor(heap, descriptor)>>)
       IN [heap |-> [heap EXCEPT ![ref[Ref]] = applied.object], isDone |-> applied.isDone]
  ELSE [heap |-> heap, isDone |-> FALSE]

DefineProperties(heap, ref, properties) ==
  LET keys == EnumerableKeys(heap[properties[Ref]])
      values == [position \\in DOMAIN keys |-> Own(heap, properties)[keys[position]]]
  IN IF ~IsRef(ref) \\/ ~IsRef(properties) \\/ \\E position \\in DOMAIN keys : ~IsRef(values[position])
     THEN [heap |-> heap, isDone |-> FALSE]
     ELSE LET descriptors == [position \\in DOMAIN keys |-> ToDescriptor(heap, values[position])]
              applied == ApplyAll(heap[ref[Ref]], keys, descriptors)
          IN [heap |-> [heap EXCEPT ![ref[Ref]] = applied.object], isDone |-> applied.isDone]

LOCAL Restrict(heap, ref, isFrozen) ==
  LET object == heap[ref[Ref]]
      attributes ==
        [key \\in DOMAIN object.attributes |->
          [object.attributes[key] EXCEPT !.configurable = FALSE,
                                         !.writable = IF isFrozen THEN FALSE ELSE @]]
  IN [heap EXCEPT ![ref[Ref]] = [object EXCEPT !.extensible = FALSE, !.attributes = attributes]]

PreventExtensions(heap, ref) == [heap EXCEPT ![ref[Ref]].extensible = FALSE]

Seal(heap, ref) == Restrict(heap, ref, FALSE)

Freeze(heap, ref) == Restrict(heap, ref, TRUE)

IsExtensible(heap, ref) == heap[ref[Ref]].extensible

IsSealed(heap, ref) ==
  LET object == heap[ref[Ref]]
  IN ~object.extensible /\\ \\A key \\in DOMAIN object.attributes : ~object.attributes[key].configurable

IsFrozen(heap, ref) ==
  LET object == heap[ref[Ref]]
  IN IsSealed(heap, ref) /\\ \\A key \\in DOMAIN object.attributes : ~object.attributes[key].writable

===============================================================================`;

export const useJavaScript = (operator: string, args: Expression[], context: Context) => {
  context.prelude.add("JavaScript");
  return apply(operator, args);
};

export const getTypeNames = (type: ts.Type, checker: ts.TypeChecker): string[] | undefined => {
  if (type.isUnion()) {
    const names = type.types.map((member) => getTypeNames(member, checker));
    return names.every((name) => name !== undefined) ? [...new Set(names.flat())] : undefined;
  }
  const flags = type.flags;
  if (flags & ts.TypeFlags.Never) return [];
  if (flags & ts.TypeFlags.NumberLike) return ["number"];
  if (flags & ts.TypeFlags.StringLike) return ["string"];
  if (flags & ts.TypeFlags.BooleanLike) return ["boolean"];
  if (flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) return ["undefined"];
  if (flags & ts.TypeFlags.Null) return ["null"];
  if (!(flags & ts.TypeFlags.Object)) return undefined;
  // A structural type such as {} or { length: number } also holds the primitives that fit it.
  const isPrimitive = [
    checker.getStringType(),
    checker.getNumberType(),
    checker.getBooleanType(),
  ].some((primitive) => checker.isTypeAssignableTo(primitive, type));
  if (isPrimitive) return undefined;
  const isFunction =
    type.getCallSignatures().length > 0 ||
    type.getConstructSignatures().length > 0 ||
    type.getSymbol()?.name === "Function";
  return [isFunction ? "function" : "object"];
};

export const translateTypeOf = (node: ts.TypeOfExpression, scope: Scope, context: Context) => {
  const names = getTypeNames(context.checker.getTypeAtLocation(node.expression), context.checker);
  const known = names && [...new Set(names.map((name) => (name === "null" ? "object" : name)))];
  if (known?.length === 1) return string(known[0]);
  if (context.modelValues.size > 0) {
    throw new TlaTypeScriptError("typeof can't tell a @symmetric value from a function", node);
  }
  return useJavaScript("TypeOf", [translateExpression(node.expression, scope, context)], context);
};

export const isComparableType = (left: ts.Type, right: ts.Type, checker: ts.TypeChecker) => {
  const names = [left, right].map((type) => getTypeNames(type, checker));
  if (names.some((name) => name === undefined)) return false;
  const kinds = new Set(
    names.flatMap((name) => name ?? []).filter((name) => name !== "null" && name !== "undefined"),
  );
  return kinds.size <= 1;
};

export const isComparable = (left: ts.Expression, right: ts.Expression, context: Context) =>
  isComparableType(
    context.checker.getTypeAtLocation(left),
    context.checker.getTypeAtLocation(right),
    context.checker,
  );

const CONVERSIONS = new Set(["Boolean", "String", "Number", "parseInt", "parseFloat"]);

const PARSERS = new Map<string, (text: string) => number>([
  ["parseInt", (text) => Number.parseInt(text)],
  ["parseFloat", Number.parseFloat],
]);

const getInteger = (value: number, node: ts.Node) => {
  if (!Number.isInteger(value) || Object.is(value, -0) || Math.abs(value) > 2 ** 31 - 1) {
    throw new TlaTypeScriptError(`Only integers are supported: ${node.getText()}`, node);
  }
  return number(value);
};

// The number that +argument or Number(argument) converts a value to.
export const translateToNumber = (
  argument: ts.Expression,
  node: ts.Expression,
  scope: Scope,
  context: Context,
) => {
  if (ts.isStringLiteral(argument)) return getInteger(Number(argument.text), node);
  const names = getTypeNames(context.checker.getTypeAtLocation(argument), context.checker);
  const kind = names?.length === 1 ? names[0] : undefined;
  if (kind === "null") return number(0);
  const value = translateExpression(argument, scope, context);
  if (kind === "number") return value;
  if (kind === "boolean") return ifExpression(value, number(1), number(0));
  throw new TlaTypeScriptError(`Unsupported expression: ${node.getText()}`, node);
};

// A call to Boolean, String, Number, parseInt, or parseFloat, or undefined for any other call.
export const translateConversion = (node: ts.CallExpression, scope: Scope, context: Context) => {
  const callee = node.expression;
  const declarations = getSymbol(callee, context.checker)?.declarations ?? [];
  if (
    !ts.isIdentifier(callee) ||
    !CONVERSIONS.has(callee.text) ||
    declarations.length === 0 ||
    !declarations.every((declaration) => declaration.getSourceFile().isDeclarationFile)
  ) {
    return undefined;
  }
  const name = callee.text;
  const unsupported = new TlaTypeScriptError(`Unsupported call: ${node.getText()}`, node);
  const argument = node.arguments.at(0);
  if (argument === undefined) {
    if (name === "Boolean") return boolean(false);
    if (name === "String") return string("");
    if (name === "Number") return number(0);
    throw unsupported;
  }
  if (node.arguments.length > 1) throw unsupported;
  if (name === "Number") return translateToNumber(argument, node, scope, context);
  const parse = PARSERS.get(name);
  if (parse !== undefined && ts.isStringLiteral(argument)) {
    return getInteger(parse(argument.text), node);
  }
  const names = getTypeNames(context.checker.getTypeAtLocation(argument), context.checker);
  const kind = names?.length === 1 ? names[0] : undefined;
  const value = translateExpression(argument, scope, context);
  const isEmpty = kind === "undefined" || kind === "null";
  if (name === "Boolean") {
    if (kind === "boolean") return value;
    if (kind === "number") return apply("#", [value, number(0)]);
    if (kind === "string") return apply("#", [value, string("")]);
    if (isEmpty || kind === "object" || kind === "function") return boolean(!isEmpty);
  }
  if (name === "String") {
    if (kind === "string") return value;
    if (kind === "number") return apply("ToString", [value]);
    if (kind === "boolean") return ifExpression(value, string("true"), string("false"));
    if (isEmpty) return string(kind);
  }
  throw unsupported;
};
