import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Context, getSymbol } from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import type { Scope } from "./scope";
import { getKind } from "./types";
import { apply, boolean, identifier, ifExpression, number, string } from "./tla";

// The names of the well-known symbols, such as iterator for Symbol.iterator.
export const WELL_KNOWN_SYMBOLS = [
  "asyncDispose",
  "asyncIterator",
  "dispose",
  "hasInstance",
  "isConcatSpreadable",
  "iterator",
  "match",
  "matchAll",
  "replace",
  "search",
  "species",
  "split",
  "toPrimitive",
  "toStringTag",
  "unscopables",
];

export const JAVASCRIPT_MODULE = `------------------------------ MODULE JavaScript ------------------------------
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS Undefined, Null, Ref, BuiltIns, ConstantFunctions, Symbols,
          NaN, Infinity, NegativeInfinity, NegativeZero

LOCAL Digits == {"-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}

\\* The numbers that TLA+ integers can't hold.
SpecialNumbers == {NaN, Infinity, NegativeInfinity, NegativeZero}

LOCAL Infinities == {Infinity, NegativeInfinity}

\\* The names of the well-known symbols, which are the first model values in Symbols. The rest stand
\\* for the symbols that a script makes, in the order it makes them.
LOCAL WellKnownSymbols == <<${WELL_KNOWN_SYMBOLS.map((name) => `"${name}"`).join(", ")}>>

\\* A model value equals only a model value, so this compares a value of any kind with Symbols.
IsSymbol(value) == \\E position \\in DOMAIN Symbols : Symbols[position] = value

LOCAL SymbolPosition(symbol) == CHOOSE position \\in DOMAIN Symbols : Symbols[position] = symbol

LOCAL IsWellKnown(value) == IsSymbol(value) /\\ SymbolPosition(value) <= Len(WellKnownSymbols)

TypeOf(value) ==
  LET text == ToString(value)
      first == SubSeq(text, 1, 1)
  IN CASE value = Undefined -> "undefined"
       [] value = Null -> "object"
       [] value \\in SpecialNumbers -> "number"
       [] text \\in {"TRUE", "FALSE"} -> "boolean"
       [] first = "\\"" -> "string"
       [] \\A i \\in 1..Len(text) : SubSeq(text, i, i) \\in Digits -> "number"
       [] first \\in {"[", "<", "{", "("} \\cup Digits -> "object"
       [] IsSymbol(value) -> "symbol"
       [] OTHER -> "function"

\\* TLC can't tell whether a value that isn't an integer is in Int, so this asks TypeOf.
IsNumber(value) == TypeOf(value) = "number"

LOCAL IsInteger(value) == IsNumber(value) /\\ value \\notin SpecialNumbers

\\* Whether a value is a number other than NaN and the infinities.
IsFinite(value) == IsInteger(value) \\/ value = NegativeZero

LOCAL IsZero(value) == value = 0 \\/ value = NegativeZero

LOCAL IsNegative(value) ==
  value = NegativeZero \\/ value = NegativeInfinity \\/ (IsInteger(value) /\\ value < 0)

LOCAL Magnitude(value) == IF value = NegativeZero THEN 0 ELSE value

LOCAL Absolute(value) == IF value < 0 THEN -value ELSE value

Negate(value) ==
  CASE value = NaN -> NaN
    [] value = Infinity -> NegativeInfinity
    [] value = NegativeInfinity -> Infinity
    [] value = NegativeZero -> 0
    [] value = 0 -> NegativeZero
    [] OTHER -> -value

Add(left, right) ==
  CASE left = NaN \\/ right = NaN -> NaN
    [] left \\in Infinities /\\ right \\in Infinities -> IF left = right THEN left ELSE NaN
    [] left \\in Infinities -> left
    [] right \\in Infinities -> right
    [] left = NegativeZero -> right
    [] right = NegativeZero -> left
    [] OTHER -> left + right

Subtract(left, right) == Add(left, Negate(right))

Multiply(left, right) ==
  LET isNegative == IsNegative(left) # IsNegative(right)
  IN CASE left = NaN \\/ right = NaN -> NaN
       [] left \\in Infinities \\/ right \\in Infinities ->
            CASE IsZero(left) \\/ IsZero(right) -> NaN
              [] isNegative -> NegativeInfinity
              [] OTHER -> Infinity
       [] OTHER ->
            LET product == Magnitude(left) * Magnitude(right)
            IN IF product = 0 /\\ isNegative THEN NegativeZero ELSE product

\\* JavaScript's /, where tla-ts represents only a quotient that is an integer, an infinity, NaN,
\\* or -0.
Divide(left, right) ==
  LET isNegative == IsNegative(left) # IsNegative(right)
      signed(magnitude) == CASE magnitude = 0 /\\ isNegative -> NegativeZero
                             [] isNegative -> -magnitude
                             [] OTHER -> magnitude
  IN CASE left = NaN \\/ right = NaN \\/ (left \\in Infinities /\\ right \\in Infinities) -> NaN
       [] left \\in Infinities -> IF isNegative THEN NegativeInfinity ELSE Infinity
       [] right \\in Infinities -> signed(0)
       [] IsZero(right) /\\ IsZero(left) -> NaN
       [] IsZero(right) -> IF isNegative THEN NegativeInfinity ELSE Infinity
       [] Absolute(Magnitude(left)) % Absolute(Magnitude(right)) = 0 ->
            signed(Absolute(Magnitude(left)) \\div Absolute(Magnitude(right)))
       [] OTHER -> Assert(FALSE, "tla-ts can't represent the fraction " \\o ToString(left) \\o " / "
                                 \\o ToString(right))

\\* JavaScript's %, whose result has the sign of the dividend.
Remainder(left, right) ==
  CASE left = NaN \\/ right = NaN \\/ left \\in Infinities \\/ IsZero(right) -> NaN
    [] right \\in Infinities \\/ IsZero(left) -> left
    [] OTHER ->
         LET remainder == Absolute(left) % Absolute(right)
         IN CASE left > 0 -> remainder
              [] remainder = 0 -> NegativeZero
              [] OTHER -> -remainder

LOCAL IsOdd(value) == IsInteger(value) /\\ value % 2 = 1

\\* JavaScript's **, as Number::exponentiate defines it.
Power(base, exponent) ==
  CASE exponent = NaN -> NaN
    [] IsZero(exponent) -> 1
    [] base = NaN -> NaN
    [] base = Infinity -> IF IsNegative(exponent) THEN 0 ELSE Infinity
    [] base = NegativeInfinity ->
         CASE ~IsNegative(exponent) /\\ IsOdd(exponent) -> NegativeInfinity
           [] ~IsNegative(exponent) -> Infinity
           [] IsOdd(-exponent) -> NegativeZero
           [] OTHER -> 0
    [] base = 0 -> IF IsNegative(exponent) THEN Infinity ELSE 0
    [] base = NegativeZero ->
         CASE ~IsNegative(exponent) /\\ IsOdd(exponent) -> NegativeZero
           [] ~IsNegative(exponent) -> 0
           [] IsOdd(-exponent) -> NegativeInfinity
           [] OTHER -> Infinity
    [] exponent \\in Infinities ->
         CASE Absolute(base) = 1 -> NaN
           [] (Absolute(base) > 1) = (exponent = Infinity) -> Infinity
           [] OTHER -> 0
    [] exponent >= 0 -> base ^ exponent
    [] Absolute(base) = 1 -> IF IsOdd(-exponent) THEN base ELSE 1
    [] OTHER -> Assert(FALSE, "tla-ts can't represent this value")

LOCAL Rank(value) ==
  CASE value = NegativeInfinity -> <<0, 0>>
    [] value = Infinity -> <<2, 0>>
    [] OTHER -> <<1, Magnitude(value)>>

LessThan(left, right) ==
  /\\ left # NaN
  /\\ right # NaN
  /\\ \\/ Rank(left)[1] < Rank(right)[1]
     \\/ Rank(left)[1] = Rank(right)[1] /\\ Rank(left)[2] < Rank(right)[2]

LessOrEqual(left, right) == left # NaN /\\ right # NaN /\\ ~LessThan(right, left)

\\* Math.abs.
AbsoluteValue(value) == IF IsNegative(value) THEN Negate(value) ELSE value

\\* Math.min and Math.max of two numbers, where NaN wins and -0 is less than 0.
Minimum(left, right) ==
  CASE left = NaN \\/ right = NaN -> NaN
    [] IsZero(left) /\\ IsZero(right) -> IF left = NegativeZero THEN left ELSE right
    [] LessThan(right, left) -> right
    [] OTHER -> left

Maximum(left, right) ==
  CASE left = NaN \\/ right = NaN -> NaN
    [] IsZero(left) /\\ IsZero(right) -> IF left = 0 THEN left ELSE right
    [] LessThan(left, right) -> right
    [] OTHER -> left

MinimumOf(values) ==
  CASE NaN \\in values -> NaN
    [] values = {} -> Infinity
    [] OTHER -> CHOOSE value \\in values : \\A other \\in values : Minimum(value, other) = value

MaximumOf(values) ==
  CASE NaN \\in values -> NaN
    [] values = {} -> NegativeInfinity
    [] OTHER -> CHOOSE value \\in values : \\A other \\in values : Maximum(value, other) = value

\\* Math.floor or Math.trunc of left / right.
LOCAL Quotient(left, right, isFloor) ==
  LET isNegative == IsNegative(left) # IsNegative(right)
      signed(magnitude) == IF isNegative THEN Negate(magnitude) ELSE magnitude
  IN CASE left = NaN \\/ right = NaN -> NaN
       [] left \\in Infinities /\\ right \\in Infinities -> NaN
       [] IsZero(left) /\\ IsZero(right) -> NaN
       [] left \\in Infinities \\/ IsZero(right) -> signed(Infinity)
       [] right \\in Infinities \\/ IsZero(left) -> signed(0)
       [] isFloor /\\ isNegative /\\ Absolute(left) % Absolute(right) # 0 ->
            -(Absolute(left) \\div Absolute(right) + 1)
       [] OTHER -> signed(Absolute(left) \\div Absolute(right))

FloorDivide(left, right) == Quotient(left, right, TRUE)

TruncDivide(left, right) == Quotient(left, right, FALSE)

\\* The position, counting from 1, of the element that a number reads, or 0 where it isn't an
\\* index.
ElementPosition(value) ==
  CASE value = NegativeZero -> 1
    [] value \\in SpecialNumbers -> 0
    [] OTHER -> value + 1

\\* The value that a Set or a Map keeps as a key, where -0 is 0.
KeyOf(value) == IF value = NegativeZero THEN 0 ELSE value

\\* The length of new Array(length), which throws a RangeError unless length is an array index.
ArrayLength(value) ==
  IF value = NegativeZero \\/ (IsInteger(value) /\\ value >= 0)
  THEN Magnitude(value)
  ELSE Assert(FALSE, "tla-ts can't throw the RangeError of an invalid array length")

\\* An index after ToIntegerOrInfinity, counting back from length where it's negative. An infinite
\\* index lands just past either end.
RelativeIndex(index, length) ==
  CASE index = NaN \\/ index = NegativeZero -> 0
    [] index = Infinity -> length
    [] index = NegativeInfinity -> -1
    [] index < 0 -> length + index
    [] OTHER -> index

ClampedIndex(index, length) ==
  LET relative == RelativeIndex(index, length)
  IN IF relative < 0 THEN 0 ELSE IF relative > length THEN length ELSE relative

SequenceWith(sequence, index, value) ==
  LET relative == RelativeIndex(index, Len(sequence))
  IN IF relative \\in 0..(Len(sequence) - 1)
     THEN [sequence EXCEPT ![relative + 1] = value]
     ELSE Assert(FALSE, "tla-ts can't throw the RangeError of with()")

RECURSIVE Join(_, _)
Join(sequence, separator) ==
  CASE sequence = <<>> -> ""
    [] Len(sequence) = 1 -> Head(sequence)
    [] OTHER -> Head(sequence) \\o separator \\o Join(Tail(sequence), separator)

RECURSIVE ReduceAt(_, _, _)
ReduceAt(Op(_, _), accumulator, positions) ==
  IF positions = <<>>
  THEN accumulator
  ELSE ReduceAt(Op, Op(accumulator, Head(positions)), Tail(positions))

Reduce(sequence, Op(_, _), isRight, hasInitial, initial) ==
  LET length == Len(sequence)
      order == [position \\in 1..length |-> IF isRight THEN length - position + 1 ELSE position]
  IN CASE hasInitial -> ReduceAt(Op, initial, order)
       [] length = 0 -> Assert(FALSE, "tla-ts can't throw the TypeError of reducing an empty array")
       [] OTHER -> ReduceAt(Op, sequence[order[1]], Tail(order))

IsRef(value) ==
  LET text == ToString(value)
  IN Len(text) >= 7 /\\ SubSeq(text, 1, 7) = "(Ref :>"

IsHeap(ref) == IsRef(ref) /\\ TypeOf(ref[Ref]) = "number"

LOCAL IsObject(value) == IsRef(value) \\/ TypeOf(value) = "function"

LOCAL ObjectPrototype == Ref :> "Object.prototype"

LOCAL Writable == [writable |-> TRUE, enumerable |-> TRUE, configurable |-> TRUE, kind |-> "data"]

EmptyObject ==
  [keys |-> <<>>, values |-> <<>>, attributes |-> <<>>, extensible |-> TRUE,
   prototype |-> ObjectPrototype, isCallable |-> FALSE, isConstructor |-> FALSE, isOpaque |-> FALSE,
   privates |-> <<>>]

\\* A heap holds the objects a script makes, and the built-in objects it has changed, by key.
EmptyHeap == [objects |-> <<>>, changed |-> <<>>, symbols |-> <<>>]

Allocate(heap, object) == [heap EXCEPT !.objects = Append(@, object)]

Allocated(heap) == Ref :> Len(heap.objects)

\\* The ref that the object an offset past the last one on the heap will have.
NextRef(heap, offset) == Ref :> (Len(heap.objects) + offset)

LOCAL BuiltInKey(ref) == IF IsRef(ref) THEN ref[Ref] ELSE ref

LOCAL IsBuiltIn(ref) ==
  /\\ IsObject(ref)
  /\\ BuiltInKey(ref) \\in DOMAIN BuiltIns
  /\\ ~BuiltIns[BuiltInKey(ref)].isOpaque

Lookup(heap, ref) ==
  CASE ref \\in {Undefined, Null} ->
         Assert(FALSE, "tla-ts can't throw the TypeError of reading a property of " \\o ToString(ref))
    [] IsHeap(ref) /\\ heap.objects[ref[Ref]].isOpaque ->
         Assert(FALSE, "tla-ts can't read the properties of a generator")
    [] IsHeap(ref) -> heap.objects[ref[Ref]]
    [] IsBuiltIn(ref) /\\ BuiltInKey(ref) \\in DOMAIN heap.changed -> heap.changed[BuiltInKey(ref)]
    [] IsBuiltIn(ref) -> BuiltIns[BuiltInKey(ref)]
    [] OTHER -> Assert(FALSE, "tla-ts can't read the properties of " \\o ToString(ref))

Update(heap, ref, object) ==
  IF IsHeap(ref)
  THEN [heap EXCEPT !.objects[ref[Ref]] = object]
  ELSE [heap EXCEPT !.changed = (BuiltInKey(ref) :> object) @@ @]

\\* Whether new can call a value.
IsConstructor(heap, value) ==
  CASE IsHeap(value) -> heap.objects[value[Ref]].isConstructor
    [] IsObject(value) /\\ BuiltInKey(value) \\in DOMAIN BuiltIns ->
         BuiltIns[BuiltInKey(value)].isConstructor
    [] TypeOf(value) # "function" -> FALSE
    [] OTHER -> Assert(FALSE, "tla-ts can't tell whether this function is a constructor")

TypeOfIn(heap, value) ==
  CASE IsHeap(value) -> IF heap.objects[value[Ref]].isCallable THEN "function" ELSE "object"
    [] IsRef(value) /\\ value[Ref] \\in DOMAIN BuiltIns ->
         IF BuiltIns[value[Ref]].isCallable THEN "function" ELSE "object"
    [] IsRef(value) -> Assert(FALSE, "tla-ts can't tell the type of " \\o ToString(value))
    [] OTHER -> TypeOf(value)

WithPrototype(object, value) ==
  CASE value = Null \\/ IsRef(value) -> [object EXCEPT !.prototype = value]
    [] TypeOf(value) \\in {"object", "function"} -> Assert(FALSE, "tla-ts can't make this a prototype")
    [] OTHER -> object

\\* An object's private names hold its private fields, and its class's key where the class has
\\* private methods or accessors. Only objects that a script makes have them.
PrivateAdd(object, key, value) == [object EXCEPT !.privates = (key :> value) @@ @]

HasPrivate(heap, ref, key) == IsHeap(ref) /\\ key \\in DOMAIN heap.objects[ref[Ref]].privates

PrivateGet(heap, ref, key) ==
  IF HasPrivate(heap, ref, key)
  THEN heap.objects[ref[Ref]].privates[key]
  ELSE Assert(FALSE, "tla-ts can't throw the TypeError of reading a private name an object lacks")

PrivateSet(heap, ref, key, value) ==
  IF HasPrivate(heap, ref, key)
  THEN [heap EXCEPT !.objects[ref[Ref]].privates[key] = value]
  ELSE Assert(FALSE, "tla-ts can't throw the TypeError of writing a private name an object lacks")

\\* A write to a property whose value TLA+ can't represent gives it one.
Put(object, key, value) ==
  IF key \\in DOMAIN object.values
  THEN [object EXCEPT !.values = (key :> value) @@ @, !.attributes[key].kind = "data"]
  ELSE [object EXCEPT !.keys = Append(@, key),
                      !.values = (key :> value) @@ @,
                      !.attributes = (key :> Writable) @@ @]

\\* The object that a generator's next gives, which CreateIterResultObject makes.
\\* A generator object, whose properties tla-ts doesn't model, as only its methods' calls run.
GeneratorObject == [EmptyObject EXCEPT !.isOpaque = TRUE]

IteratorResult(value, isDone) == Put(Put(EmptyObject, "value", value), "done", isDone)

\\* A property that a class defines, with its attributes.
Define(object, key, value, isWritable, isEnumerable, isConfigurable) ==
  [object EXCEPT !.keys = IF key \\in DOMAIN object.values THEN @ ELSE Append(@, key),
                 !.values = (key :> value) @@ @,
                 !.attributes = (key :> [writable |-> isWritable, enumerable |-> isEnumerable,
                                         configurable |-> isConfigurable, kind |-> "data"]) @@ @]

\\* A public field that a class defines on an object, which fails where the object has the key
\\* unconfigurable, or lacks it and can't grow.
DefineField(heap, ref, key, value) ==
  LET object == Lookup(heap, ref)
  IN IF IF key \\in DOMAIN object.values THEN object.attributes[key].configurable ELSE object.extensible
     THEN [heap |-> Update(heap, ref, Define(object, key, value, TRUE, TRUE, TRUE)), isDone |-> TRUE]
     ELSE [heap |-> heap, isDone |-> FALSE]

\\* The object of a class's constructor, which inherits from Function.prototype.
ClassObject(functionPrototype) ==
  [EmptyObject EXCEPT !.isCallable = TRUE, !.isConstructor = TRUE, !.prototype = functionPrototype]

\\* An arrow function, which has no prototype and can't construct.
ArrowObject(functionPrototype, name, length) ==
  Define(Define([ClassObject(functionPrototype) EXCEPT !.isConstructor = FALSE],
                "length", length, FALSE, FALSE, TRUE),
         "name", name, FALSE, FALSE, TRUE)

\\* A generator function, which can't construct, and its prototype object, which the generator
\\* objects it makes inherit from. tla-ts can't read the properties of the built-in objects they
\\* inherit from.
GeneratorFunctionObject(name, length, prototype) ==
  Define(ArrowObject(Ref :> "GeneratorFunction.prototype", name, length),
         "prototype", prototype, TRUE, FALSE, FALSE)

GeneratorPrototypeObject == [EmptyObject EXCEPT !.prototype = Ref :> "GeneratorFunction.prototype.prototype"]

\\* Whether one string of digits is below another of the same length.
RECURSIVE DigitsBelow(_, _)
DigitsBelow(left, right) ==
  LET digit(text) == CHOOSE value \\in 0..9 : ToString(value) = SubSeq(text, 1, 1)
  IN /\\ left # ""
     /\\ \\/ digit(left) < digit(right)
        \\/ digit(left) = digit(right) /\\ DigitsBelow(Tail(left), Tail(right))

\\* An array index is below 2^32 - 1, where TLC's integers hold only those below 2^31.
LOCAL IsIndex(key) ==
  /\\ Len(key) > 0
  /\\ \\A position \\in 1..Len(key) : SubSeq(key, position, position) \\in Digits \\ {"-"}
  /\\ Len(key) = 1 \\/ SubSeq(key, 1, 1) # "0"
  /\\ \\/ Len(key) < 10
     \\/ /\\ Len(key) = 10
        /\\ Assert(~DigitsBelow(key, "4294967295"), "tla-ts can't order keys this big")
        /\\ FALSE

RECURSIVE ToIndex(_)
ToIndex(key) ==
  IF key = ""
  THEN 0
  ELSE 10 * ToIndex(SubSeq(key, 1, Len(key) - 1))
         + (CHOOSE digit \\in 0..9 : ToString(digit) = SubSeq(key, Len(key), Len(key)))

\\* An object's own string keys, with the indices first in order.
OwnKeys(object) ==
  LET strings == SelectSeq(object.keys, LAMBDA key : ~IsSymbol(key))
  IN SortSeq(SelectSeq(strings, IsIndex), LAMBDA left, right : ToIndex(left) < ToIndex(right))
       \\o SelectSeq(strings, LAMBDA key : ~IsIndex(key))

LOCAL EnumerableKeys(object) ==
  SelectSeq(OwnKeys(object), LAMBDA key : object.attributes[key].enumerable)

\\* The enumerable own keys that spread and Object.assign copy, which include symbols.
LOCAL EnumerableOwnKeys(object) ==
  SelectSeq(OwnKeys(object) \\o SelectSeq(object.keys, IsSymbol),
            LAMBDA key : object.attributes[key].enumerable)

LOCAL Value(object, key) ==
  LET attributes == object.attributes[key]
  IN CASE attributes.kind = "data" -> object.values[key]
       [] attributes.kind = "accessor" /\\ object.values[key].get = Undefined -> Undefined
       [] attributes.kind = "accessor" /\\ object.values[key].get \\in DOMAIN ConstantFunctions ->
            ConstantFunctions[object.values[key].get]
       [] attributes.kind = "accessor" -> Assert(FALSE, "tla-ts can't call getters")
       [] OTHER -> Assert(FALSE, "tla-ts can't represent this value")

Own(heap, ref) == Lookup(heap, ref).values

\\* The keys a for-in visits: each enumerable key once, own keys first, and none that an object
\\* nearer the start of the prototype chain has.
RECURSIVE ForInKeys(_, _)
ForInKeys(heap, ref) ==
  LET object == Lookup(heap, ref)
      inherited == IF object.prototype = Null THEN <<>> ELSE ForInKeys(heap, object.prototype)
  IN SelectSeq(OwnKeys(object), LAMBDA key : object.attributes[key].enumerable)
       \\o SelectSeq(inherited, LAMBDA key : key \\notin DOMAIN object.values)

OwnPropertyNames(heap, ref) == OwnKeys(Lookup(heap, ref))

RECURSIVE PutAll(_, _, _)
PutAll(object, values, keys) ==
  IF keys = <<>>
  THEN object
  ELSE PutAll(Put(object, Head(keys), values[Head(keys)]), values, Tail(keys))

Spread(object, heap, ref) ==
  LET source == Lookup(heap, ref)
  IN PutAll(object, [key \\in DOMAIN source.values |-> Value(source, key)], EnumerableOwnKeys(source))

Describe(heap, ref, key) ==
  LET object == Lookup(heap, ref)
      attributes == object.attributes[key]
      isAccessor == attributes.kind = "accessor"
      fields ==
        IF isAccessor
        THEN [get |-> object.values[key].get, set |-> object.values[key].set]
        ELSE [value |-> object.values[key], writable |-> attributes.writable]
      described ==
        PutAll(EmptyObject,
               fields @@ [enumerable |-> attributes.enumerable,
                          configurable |-> attributes.configurable],
               IF isAccessor
               THEN <<"get", "set", "enumerable", "configurable">>
               ELSE <<"value", "writable", "enumerable", "configurable">>)
  \\* A description's value is one TLA+ can't represent where the property's is.
  IN CASE key \\notin DOMAIN object.values -> EmptyObject
       [] isAccessor -> described
       [] OTHER -> [described EXCEPT !.attributes["value"].kind = attributes.kind]

HasOwn(heap, ref, key) == key \\in DOMAIN Own(heap, ref)

IsEnumerableOwn(heap, ref, key) ==
  LET object == Lookup(heap, ref)
  IN key \\in DOMAIN object.values /\\ object.attributes[key].enumerable

Prototype(heap, ref) == Lookup(heap, ref).prototype

RECURSIVE Has(_, _, _)
Has(heap, ref, key) ==
  \\/ key \\in DOMAIN Own(heap, ref)
  \\/ LET prototype == Prototype(heap, ref) IN prototype # Null /\\ Has(heap, prototype, key)

\\* An error is a record of its constructor, its message and its name.
LOCAL IsError(value) ==
  SubSeq(ToString(value), 1, 1) = "[" /\\ DOMAIN value = {"constructor", "message", "name"}

\\* An error inherits its other properties from its constructor's prototype. The message of an error
\\* that JavaScript throws differs between engines, and tla-ts gives it none. A script can't read or
\\* change the prototype of an error class that isn't an object tla-ts holds, so its constructor
\\* property is still the class.
RECURSIVE Get(_, _, _)
Get(heap, ref, key) ==
  IF ~IsRef(ref) /\\ IsError(ref)
  THEN CASE key = "message" /\\ ref.message # "" -> ref.message
         [] key = "message" -> Assert(FALSE, "tla-ts can't read the message of this error")
         [] key = "constructor" /\\ ~IsHeap(ref.constructor) /\\ ~IsBuiltIn(ref.constructor) ->
              ref.constructor
         [] OTHER -> Get(heap, Get(heap, ref.constructor, "prototype"), key)
  ELSE LET object == Lookup(heap, ref)
       IN CASE key \\in DOMAIN object.values -> Value(object, key)
            [] object.prototype = Null -> Undefined
            [] OTHER -> Get(heap, object.prototype, key)

\\* The heap after a pattern reads keys of an object, which TLC would read only where something
\\* reads what the pattern binds, so that a getter that tla-ts can't call stops the check.
ReadKeys(heap, ref, keys) ==
  CASE ref \\in {Undefined, Null} ->
         Assert(FALSE, "tla-ts can't throw the TypeError of destructuring " \\o ToString(ref))
    [] \\A key \\in keys : Get(heap, ref, key) = Get(heap, ref, key) -> heap
    [] OTHER -> heap

\\* TLC builds a function's values only where something reads them. This reads each one, so a getter
\\* that tla-ts can't call stops the check even where nothing reads what it gives.
LOCAL Read(values) ==
  IF \\A position \\in DOMAIN values : values[position] = values[position] THEN values ELSE values

ObjectKeys(heap, ref) == EnumerableKeys(Lookup(heap, ref))

ObjectValues(heap, ref) ==
  LET keys == ObjectKeys(heap, ref)
  IN  Read([position \\in DOMAIN keys |-> Get(heap, ref, keys[position])])

\\* The object that an object pattern's rest element makes, which holds the enumerable own properties
\\* of the object that the pattern reads, except those it names, in their order.
RestObject(heap, ref, excluded) ==
  LET keys == SelectSeq(EnumerableOwnKeys(Lookup(heap, ref)), LAMBDA key : key \\notin excluded)
      kept == {keys[position] : position \\in DOMAIN keys}
  IN [EmptyObject EXCEPT !.keys = keys,
                         !.values = Read([key \\in kept |-> Get(heap, ref, key)]),
                         !.attributes = [key \\in kept |-> Writable]]

ObjectEntries(heap, ref) ==
  LET keys == ObjectKeys(heap, ref)
  IN  Read([position \\in DOMAIN keys |-> <<keys[position], Get(heap, ref, keys[position])>>])

LOCAL IsDigitText(text) ==
  \\A position \\in 1..Len(text) : SubSeq(text, position, position) \\in Digits \\ {"-"}

LOCAL Alphanumerics == "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

LOCAL CharactersOf(text) == {SubSeq(text, position, position) : position \\in 1..Len(text)}

\\* The digits of a radix, where a digit past 9 is a letter of either case.
LOCAL DigitsOf(radix) ==
  {SubSeq(Alphanumerics, value + 1, value + 1) : value \\in 0..(radix - 1)}
    \\cup {SubSeq(Alphanumerics, value + 27, value + 27) : value \\in 10..(radix - 1)}

LOCAL DigitValue(character) ==
  CHOOSE value \\in 0..35 :
    \\/ SubSeq(Alphanumerics, value + 1, value + 1) = character
    \\/ value >= 10 /\\ SubSeq(Alphanumerics, value + 27, value + 27) = character

RECURSIVE StripZeros(_)
StripZeros(text) ==
  IF Len(text) > 1 /\\ SubSeq(text, 1, 1) = "0" THEN StripZeros(Tail(text)) ELSE text

\\* The digits of a radix that a TLC integer always holds.
LOCAL MaxDigits(radix) == CASE radix = 2 -> 30 [] radix = 8 -> 10 [] radix = 10 -> 9 [] OTHER -> 7

RECURSIVE ParseDigits(_, _)
ParseDigits(text, radix) ==
  IF text = ""
  THEN 0
  ELSE radix * ParseDigits(SubSeq(text, 1, Len(text) - 1), radix)
         + DigitValue(SubSeq(text, Len(text), Len(text)))

LOCAL ParseFitting(text, radix) ==
  LET stripped == StripZeros(text)
  IN IF Len(stripped) <= MaxDigits(radix)
     THEN ParseDigits(stripped, radix)
     ELSE Assert(FALSE, "tla-ts can't represent the number " \\o text)

LOCAL Prefix(text, length) == IF Len(text) < length THEN text ELSE SubSeq(text, 1, length)

\\* ToNumber of a string, without whitespace, which Use takes as its kind, its sign, and its
\\* magnitude truncated toward 0. TLC evaluates an argument only where Use reads it, so a magnitude
\\* too big for TLC doesn't stop the check where Use doesn't need it.
LOCAL ReadNumber(text, Use(_, _, _)) ==
  LET prefix == Prefix(text, 2)
      body == SubSeq(text, 3, Len(text))
      radix == CASE prefix \\in {"0x", "0X"} -> 16
                 [] prefix \\in {"0o", "0O"} -> 8
                 [] prefix \\in {"0b", "0B"} -> 2
                 [] OTHER -> 10
      isNegative == Prefix(text, 1) = "-"
      unsigned == IF Prefix(text, 1) \\in {"+", "-"} THEN Tail(text) ELSE text
      exponents == {position \\in 1..Len(unsigned) : SubSeq(unsigned, position, position) \\in {"e", "E"}}
      exponent == IF exponents = {} THEN Len(unsigned) + 1 ELSE CHOOSE position \\in exponents : TRUE
      mantissa == SubSeq(unsigned, 1, exponent - 1)
      exponentText == SubSeq(unsigned, exponent + 1, Len(unsigned))
      exponentDigits ==
        IF Prefix(exponentText, 1) \\in {"+", "-"} THEN Tail(exponentText) ELSE exponentText
      points == {position \\in 1..Len(mantissa) : SubSeq(mantissa, position, position) = "."}
      point == IF points = {} THEN Len(mantissa) + 1 ELSE CHOOSE position \\in points : TRUE
      whole == SubSeq(mantissa, 1, point - 1)
      fraction == SubSeq(mantissa, point + 1, Len(mantissa))
      isDecimal ==
        /\\ \\A left, right \\in exponents : left = right
        /\\ \\A left, right \\in points : left = right
        /\\ exponents = {} \\/ exponentDigits # ""
        /\\ Len(whole) + Len(fraction) > 0
        /\\ IsDigitText(whole) /\\ IsDigitText(fraction) /\\ IsDigitText(exponentDigits)
      significand == StripZeros(whole \\o fraction)
      shift ==
        (IF Prefix(exponentText, 1) = "-" THEN -1 ELSE 1) * ParseFitting(exponentDigits, 10)
          - Len(fraction)
      kept == Len(significand) + shift
      magnitude ==
        CASE significand = "0" \\/ kept <= 0 -> 0
          [] shift >= 0 -> ParseFitting(significand, 10) * 10 ^ shift
          [] OTHER -> ParseFitting(SubSeq(significand, 1, kept), 10)
      isExact ==
        \\/ significand = "0"
        \\/ shift >= 0
        \\/ \\A position \\in (IF kept < 1 THEN 1 ELSE kept + 1)..Len(significand) :
             SubSeq(significand, position, position) = "0"
  IN CASE text = "" -> Use("integer", FALSE, 0)
       [] radix # 10 /\\ body # "" /\\ CharactersOf(body) \\subseteq DigitsOf(radix) ->
            Use("integer", FALSE, ParseFitting(body, radix))
       [] isDecimal -> Use(IF isExact THEN "integer" ELSE "fraction", isNegative, magnitude)
       [] text \\in {"Infinity", "+Infinity", "-Infinity"} -> Use("infinity", isNegative, 0)
       [] CharactersOf(text) \\subseteq CharactersOf(Alphanumerics) \\cup {"+", "-", ".", "_", "!"} ->
            Use("nan", FALSE, 0)
       [] OTHER -> Assert(FALSE, "tla-ts can't convert " \\o ToString(text) \\o " to a number")

\\* ToLength of a string, truncated and clamped at 0.
LOCAL ToLengthOfText(text) ==
  ReadNumber(text, LAMBDA kind, isNegative, magnitude :
    CASE kind = "nan" \\/ isNegative -> 0
      [] kind = "infinity" -> Assert(FALSE, "tla-ts can't convert " \\o ToString(text) \\o " to a length")
      [] OTHER -> magnitude)

\\* ToLength of a length property.
ToLength(value) ==
  CASE value \\in {Undefined, Null} -> 0
    [] TypeOf(value) = "boolean" -> IF value THEN 1 ELSE 0
    [] value = Infinity -> Assert(FALSE, "tla-ts can't represent this value")
    [] value \\in SpecialNumbers -> 0
    [] TypeOf(value) = "number" -> IF value < 0 THEN 0 ELSE value
    [] TypeOf(value) = "string" -> ToLengthOfText(value)
    [] value = <<>> -> 0
    [] OTHER -> Assert(FALSE, "tla-ts can't convert " \\o ToString(value) \\o " to a length")

RECURSIVE KeyCount(_, _)
KeyCount(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN Len(object.keys) + IF object.prototype = Null THEN 0 ELSE KeyCount(heap, object.prototype)

\\* The elements of an array-like object, which has an element at each index below its length.
ArrayLike(heap, ref) ==
  LET length == ToLength(Get(heap, ref, "length"))
  IN IF \\/ length > KeyCount(heap, ref)
        \\/ \\E position \\in 0..(length - 1) : ~Has(heap, ref, ToString(position))
     THEN Assert(FALSE, "tla-ts can't read an array-like object with holes")
     ELSE Read([position \\in 1..length |-> Get(heap, ref, ToString(position - 1))])

RECURSIVE IndexKeys(_, _)
IndexKeys(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN {key \\in DOMAIN object.values : IsIndex(key)}
       \\cup IF object.prototype = Null THEN {} ELSE IndexKeys(heap, object.prototype)

\\* The elements that an array-like object or its prototypes hold below its length, in order, with
\\* their indices. The array methods that skip holes visit these. A record holds the length, so TLC
\\* reads it even when no element is present.
PresentElements(heap, ref) ==
  LET length == ToLength(Get(heap, ref, "length"))
      present == {position \\in {ToIndex(key) : key \\in IndexKeys(heap, ref)} : position < length}
      indices == [position \\in 1..Cardinality(present) |->
                   CHOOSE element \\in present :
                     Cardinality({other \\in present : other < element}) = position - 1]
  IN [length |-> length,
      indices |-> indices,
      values |-> Read([position \\in DOMAIN indices |-> Get(heap, ref, ToString(indices[position]))])]

\\* The accessor that a write to a key calls, which the object or a prototype holds, or Undefined
\\* where the write makes or changes a data property.
RECURSIVE AccessorOf(_, _, _)
AccessorOf(heap, ref, key) ==
  LET object == Lookup(heap, ref)
  IN CASE key \\in DOMAIN object.values ->
            IF object.attributes[key].kind = "accessor" THEN object.values[key] ELSE Undefined
       [] object.prototype = Null -> Undefined
       [] OTHER -> AccessorOf(heap, object.prototype, key)

RECURSIVE AccessorFieldOf(_, _, _, _)
AccessorFieldOf(heap, ref, key, field) ==
  LET object == Lookup(heap, ref)
  IN CASE key \\in DOMAIN object.values ->
            IF object.attributes[key].kind = "accessor"
            THEN object.values[key][field]
            ELSE Undefined
       [] object.prototype = Null -> Undefined
       [] OTHER -> AccessorFieldOf(heap, object.prototype, key, field)

GetterOf(heap, ref, key) == AccessorFieldOf(heap, ref, key, "get")

SetterOf(heap, ref, key) == AccessorFieldOf(heap, ref, key, "set")

RECURSIVE IsWritable(_, _, _)
IsWritable(heap, ref, key) ==
  LET object == Lookup(heap, ref)
  IN IF key \\in DOMAIN object.values
     THEN object.attributes[key].writable
     ELSE object.prototype = Null \\/ IsWritable(heap, object.prototype, key)

CanPut(heap, ref, key) ==
  LET accessor == AccessorOf(heap, ref, key)
  IN IF accessor = Undefined
     THEN /\\ IsWritable(heap, ref, key)
          /\\ key \\in DOMAIN Own(heap, ref) \\/ Lookup(heap, ref).extensible
     ELSE accessor.set # Undefined

RECURSIVE IsPrototypeOf(_, _, _)
IsPrototypeOf(heap, owner, ref) ==
  LET prototype == Prototype(heap, ref)
  IN /\\ prototype # Null
     /\\ \\/ ToString(prototype) = ToString(owner)
        \\/ IsPrototypeOf(heap, owner, prototype)

CanDelete(heap, ref, key) ==
  LET object == Lookup(heap, ref)
  IN key \\notin DOMAIN object.values \\/ object.attributes[key].configurable

Delete(heap, ref, key) ==
  LET object == Lookup(heap, ref)
      kept == DOMAIN object.values \\ {key}
  IN IF key \\in DOMAIN object.values
     THEN Update(heap, ref, [object EXCEPT !.keys = SelectSeq(@, LAMBDA other : other # key),
                                           !.values = [other \\in kept |-> @[other]],
                                           !.attributes = [other \\in kept |-> @[other]]])
     ELSE heap

SameValue(left, right) ==
  /\\ TypeOf(left) = TypeOf(right)
  /\\ Assert(TypeOf(left) # "object" \\/ left = Null \\/ right = Null
              \\/ IsRef(left) \\/ IsRef(right),
            "tla-ts can't compare objects by identity")
  /\\ IF IsRef(left) \\/ IsRef(right) THEN ToString(left) = ToString(right) ELSE left = right

\\* JavaScript's ===, where NaN differs from itself and -0 equals 0.
StrictEquals(left, right) ==
  IF IsNumber(left) /\\ IsNumber(right)
  THEN left # NaN /\\ right # NaN /\\ Magnitude(left) = Magnitude(right)
  ELSE SameValue(left, right)

\\* What includes and Set compare by, where NaN equals itself and -0 equals 0.
SameValueZero(left, right) ==
  IF IsNumber(left) /\\ IsNumber(right)
  THEN Magnitude(left) = Magnitude(right)
  ELSE SameValue(left, right)

StringOf(value) ==
  CASE value = Undefined -> "undefined"
    [] value = Null -> "null"
    [] TypeOf(value) = "boolean" -> IF value THEN "true" ELSE "false"
    [] TypeOf(value) = "string" -> value
    [] value = NegativeInfinity -> "-Infinity"
    [] value = NegativeZero -> "0"
    [] TypeOf(value) = "number" -> ToString(value)
    [] OTHER -> Assert(FALSE, "tla-ts can't convert objects to strings")

\\* The heap after Symbol(description) makes a symbol, which holds the symbol's description.
NewSymbol(heap, description) ==
  IF Len(WellKnownSymbols) + Len(heap.symbols) < Len(Symbols)
  THEN [heap EXCEPT !.symbols =
          Append(@, IF description = Undefined THEN Undefined ELSE StringOf(description))]
  ELSE Assert(FALSE, "tla-ts can't make more symbols than a script has calls of Symbol")

\\* The symbol that the last call of Symbol made.
NewestSymbol(heap) == Symbols[Len(WellKnownSymbols) + Len(heap.symbols)]

WellKnownSymbol(name) ==
  Symbols[CHOOSE position \\in DOMAIN WellKnownSymbols : WellKnownSymbols[position] = name]

SymbolDescription(heap, symbol) ==
  LET position == SymbolPosition(symbol)
  IN IF position <= Len(WellKnownSymbols)
     THEN "Symbol." \\o WellKnownSymbols[position]
     ELSE heap.symbols[position - Len(WellKnownSymbols)]

\\* What String(symbol) and symbol.toString() give.
SymbolString(heap, symbol) ==
  LET description == SymbolDescription(heap, symbol)
  IN "Symbol(" \\o (IF description = Undefined THEN "" ELSE description) \\o ")"

\\* The key that a symbol gives. tla-ts doesn't know which properties of the built-in objects the
\\* well-known symbols name, nor run what JavaScript runs through them, so it uses none as a key.
SymbolKey(symbol) ==
  IF IsWellKnown(symbol)
  THEN Assert(FALSE, "tla-ts can't use a well-known symbol as a key")
  ELSE symbol

PropertyKey(value) == IF IsSymbol(value) THEN SymbolKey(value) ELSE StringOf(value)

\\* What a symbol's toString, valueOf, or description gives, where Symbol.prototype still holds the
\\* built-in method or getter.
SymbolProperty(heap, symbol, prototype, name) ==
  LET found == IF name = "description"
               THEN GetterOf(heap, prototype, name)
               ELSE Get(heap, prototype, name)
      builtIn == Ref :> ((IF name = "description" THEN "get " ELSE "") \\o "Symbol.prototype." \\o name)
  IN CASE ~SameValue(found, builtIn) ->
            Assert(FALSE, "tla-ts can't call a symbol's " \\o name \\o " that a script replaced")
       [] name = "toString" -> SymbolString(heap, symbol)
       [] name = "valueOf" -> symbol
       [] OTHER -> SymbolDescription(heap, symbol)

\\* The text that a string method reads, where tla-ts reads only strings.
LOCAL Text(value) ==
  IF TypeOf(value) = "string"
  THEN value
  ELSE Assert(FALSE, "tla-ts can't call a string method on a value that isn't a string")

\\* The string that String.prototype.method.call reads from the value that it calls the method on.
ThisString(value) ==
  IF value \\in {Undefined, Null}
  THEN Assert(FALSE, "tla-ts can't throw the TypeError of a string method on undefined or null")
  ELSE StringOf(value)

\\* The primitive that a String, Number, or Boolean object holds, for a call of a method that it
\\* reads from its prototype, which must still hold the built-in method. The prototype itself holds
\\* "", 0, or false.
WrappedPrimitive(heap, ref, kind, method) ==
  LET isPrototype == IsRef(ref) /\\ ~IsHeap(ref) /\\ ref[Ref] = kind \\o ".prototype"
      isWrapper ==
        /\\ IsHeap(ref)
        /\\ "primitive" \\in DOMAIN Lookup(heap, ref)
        /\\ TypeOf(Lookup(heap, ref).primitive) =
             CASE kind = "String" -> "string" [] kind = "Number" -> "number" [] OTHER -> "boolean"
  IN IF /\\ isPrototype \\/ isWrapper
        /\\ IsRef(Get(heap, ref, method))
        /\\ ~IsHeap(Get(heap, ref, method))
        /\\ Get(heap, ref, method)[Ref] = kind \\o ".prototype." \\o method
     THEN CASE isWrapper -> Lookup(heap, ref).primitive
            [] kind = "String" -> ""
            [] kind = "Number" -> 0
            [] OTHER -> FALSE
     ELSE Assert(FALSE, "tla-ts can't call this method on " \\o ToString(ref))

PrimitiveOf(value) == value

\\* What valueOf gives for a primitive whose prototype, one of Boolean.prototype, Number.prototype,
\\* or String.prototype, still holds the built-in valueOf, for a wrapper object, or for an object
\\* that reads Object.prototype.valueOf.
ValueOf(heap, value, prototypes) ==
  LET position == CASE TypeOf(value) = "boolean" -> 1
                    [] TypeOf(value) = "number" -> 2
                    [] TypeOf(value) = "string" -> 3
                    [] OTHER -> 0
      kinds == <<"Boolean", "Number", "String">>
      method == IF position = 0 THEN Undefined ELSE Get(heap, prototypes[position], "valueOf")
  IN CASE position # 0 /\\ IsRef(method) /\\ ~IsHeap(method) /\\
            method[Ref] = kinds[position] \\o ".prototype.valueOf" -> value
       [] IsHeap(value) /\\ "primitive" \\in DOMAIN Lookup(heap, value) ->
            WrappedPrimitive(heap, value, kinds[CASE TypeOf(Lookup(heap, value).primitive) = "boolean" -> 1
                                                 [] TypeOf(Lookup(heap, value).primitive) = "number" -> 2
                                                 [] OTHER -> 3], "valueOf")
       [] /\\ IsHeap(value)
          /\\ IsRef(Get(heap, value, "valueOf"))
          /\\ ~IsHeap(Get(heap, value, "valueOf"))
          /\\ Get(heap, value, "valueOf")[Ref] = "Object.prototype.valueOf" -> value
       [] OTHER -> Assert(FALSE, "tla-ts can't call valueOf on " \\o ToString(value))

BooleanToString(value) == IF value THEN "true" ELSE "false"

\\* The boolean that Boolean.prototype.method.call reads from the value that it calls the method on.
ThisBoolean(value) ==
  IF TypeOf(value) = "boolean"
  THEN value
  ELSE Assert(FALSE, "tla-ts can't call a Boolean.prototype method on a value that isn't a boolean")

\\* The number that Number.prototype.method.call reads from the value that it calls the method on.
ThisNumber(value) ==
  IF TypeOf(value) = "number"
  THEN value
  ELSE Assert(FALSE, "tla-ts can't call a Number.prototype method on a value that isn't a number")

\\* ToIntegerOrInfinity of a number or undefined.
LOCAL IntegerOf(value) == IF value \\in {Undefined, NaN, NegativeZero} THEN 0 ELSE value

\\* An integer or an infinity, clamped to 0..length.
LOCAL Clamp(value, length) ==
  CASE value = Infinity -> length
    [] value = NegativeInfinity -> 0
    [] value < 0 -> 0
    [] value > length -> length
    [] OTHER -> value

LOCAL OccursAt(text, search, index) ==
  index + Len(search) <= Len(text) /\\ SubSeq(text, index + 1, index + Len(search)) = search

LOCAL Occurrences(text, search) ==
  {index \\in 0..(Len(text) - Len(search)) : OccursAt(text, search, index)}

StringAt(value, index) ==
  LET text == Text(value)
      relative == RelativeIndex(IntegerOf(index), Len(text))
  IN  IF relative >= 0 /\\ relative < Len(text)
      THEN SubSeq(text, relative + 1, relative + 1)
      ELSE Undefined

CharAt(value, index) ==
  LET text == Text(value)
      position == IntegerOf(index)
  IN  IF position \\notin {Infinity, NegativeInfinity} /\\ position >= 0 /\\ position < Len(text)
      THEN SubSeq(text, position + 1, position + 1)
      ELSE ""

StringSlice(value, start, end) ==
  LET text == Text(value)
  IN  SubSeq(text,
             ClampedIndex(IntegerOf(start), Len(text)) + 1,
             IF end = Undefined THEN Len(text) ELSE ClampedIndex(IntegerOf(end), Len(text)))

Substring(value, start, end) ==
  LET text == Text(value)
      from == Clamp(IntegerOf(start), Len(text))
      to == IF end = Undefined THEN Len(text) ELSE Clamp(IntegerOf(end), Len(text))
  IN  IF from < to THEN SubSeq(text, from + 1, to) ELSE SubSeq(text, to + 1, from)

StringIndexOf(value, search, position) ==
  LET text == Text(value)
      found == {index \\in Occurrences(text, Text(search)) :
                  index >= Clamp(IntegerOf(position), Len(text))}
  IN  IF found = {} THEN -1 ELSE CHOOSE index \\in found : \\A other \\in found : index <= other

\\* String.prototype.lastIndexOf, which searches from the end where position is NaN.
StringLastIndexOf(value, search, position) ==
  LET text == Text(value)
      start == IF position \\in {Undefined, NaN}
               THEN Len(text)
               ELSE Clamp(IntegerOf(position), Len(text))
      found == {index \\in Occurrences(text, Text(search)) : index <= start}
  IN  IF found = {} THEN -1 ELSE CHOOSE index \\in found : \\A other \\in found : index >= other

StringIncludes(value, search, position) == StringIndexOf(value, search, position) # -1

StartsWith(value, search, position) ==
  LET text == Text(value)
  IN  OccursAt(text, Text(search), Clamp(IntegerOf(position), Len(text)))

EndsWith(value, search, position) ==
  LET text == Text(value)
      end == IF position = Undefined THEN Len(text) ELSE Clamp(IntegerOf(position), Len(text))
  IN  end >= Len(Text(search)) /\\ OccursAt(text, search, end - Len(search))

RECURSIVE RadixDigits(_, _)
RadixDigits(value, radix) ==
  LET digit == value % radix
  IN  IF value < radix
      THEN SubSeq("0123456789abcdefghijklmnopqrstuvwxyz", digit + 1, digit + 1)
      ELSE RadixDigits(value \\div radix, radix)
             \\o SubSeq("0123456789abcdefghijklmnopqrstuvwxyz", digit + 1, digit + 1)

\\* Number.prototype.toString, which writes a number in a radix from 2 to 36.
NumberToString(value, radix) ==
  LET base == IF radix = Undefined THEN 10 ELSE IntegerOf(radix)
  IN  CASE ~IsInteger(base) \\/ base < 2 \\/ base > 36 ->
             Assert(FALSE, "tla-ts can't throw the RangeError of a radix outside 2 to 36")
        [] ~IsInteger(value) \\/ base = 10 -> StringOf(value)
        [] value < 0 -> "-" \\o RadixDigits(-value, base)
        [] OTHER -> RadixDigits(value, base)

\\* The characters that trim() removes: WhiteSpace and LineTerminator.
LOCAL Spaces ==
  {"\\t", "\\n", "\\r", "\\f", " ", "\u000B", "\u00A0", "\uFEFF", "\u1680", "\u202F", "\u205F", "\u3000", "\u2028", "\u2029"}
    \\cup {SubSeq("\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A", position, position) : position \\in 1..11}

RECURSIVE TrimStart(_)
TrimStart(text) ==
  IF text # "" /\\ SubSeq(text, 1, 1) \\in Spaces THEN TrimStart(SubSeq(text, 2, Len(text))) ELSE text

RECURSIVE TrimEnd(_)
TrimEnd(text) ==
  IF text # "" /\\ SubSeq(text, Len(text), Len(text)) \\in Spaces
  THEN TrimEnd(SubSeq(text, 1, Len(text) - 1))
  ELSE text

StringTrim(value, isStart, isEnd) ==
  LET started == IF isStart THEN TrimStart(Text(value)) ELSE Text(value)
  IN  IF isEnd THEN TrimEnd(started) ELSE started

ToBoolean(value) ==
  CASE value \\in {Undefined, Null} -> FALSE
    [] TypeOf(value) = "boolean" -> value
    [] TypeOf(value) = "number" -> value \\notin {0, NaN, NegativeZero}
    [] TypeOf(value) = "string" -> value # ""
    [] OTHER -> TRUE

LOCAL Fields == {"value", "writable", "get", "set", "enumerable", "configurable"}

\\* A descriptor is valid if its get and set are functions or undefined, and it doesn't mix them
\\* with value or writable. Otherwise ToPropertyDescriptor throws a TypeError.
LOCAL ToDescriptor(heap, ref) ==
  LET fields == {field \\in Fields : Has(heap, ref, field)}
      isCallable(field) ==
        LET value == Get(heap, ref, field) IN value = Undefined \\/ TypeOfIn(heap, value) = "function"
      isAccessor == fields \\cap {"get", "set"} # {}
      isData == fields \\cap {"value", "writable"} # {}
  IN [fields |-> fields,
      isAccessor |-> isAccessor,
      isData |-> isData,
      isValid |-> /\\ \\A field \\in fields \\cap {"get", "set"} : isCallable(field)
                  /\\ ~(isAccessor /\\ isData),
      value |-> Get(heap, ref, "value"),
      get |-> Get(heap, ref, "get"),
      set |-> Get(heap, ref, "set"),
      writable |-> ToBoolean(Get(heap, ref, "writable")),
      enumerable |-> ToBoolean(Get(heap, ref, "enumerable")),
      configurable |-> ToBoolean(Get(heap, ref, "configurable"))]

\\* No value a script makes is the same as a value TLA+ can't represent.
LOCAL CanApply(object, key, descriptor) ==
  LET has(field) == field \\in descriptor.fields
      current == object.attributes[key]
      isSame(field) == SameValue(descriptor[field], object.values[key][field])
  IN CASE key \\notin DOMAIN object.values -> object.extensible
       [] current.configurable -> TRUE
       [] has("configurable") /\\ descriptor.configurable -> FALSE
       [] has("enumerable") /\\ descriptor.enumerable # current.enumerable -> FALSE
       [] (descriptor.isAccessor \\/ descriptor.isData)
            /\\ descriptor.isAccessor # (current.kind = "accessor") -> FALSE
       [] current.kind = "accessor" ->
            \\A field \\in {"get", "set"} : has(field) => isSame(field)
       [] current.writable -> TRUE
       [] OTHER ->
            /\\ ~(has("writable") /\\ descriptor.writable)
            /\\ has("value") => current.kind = "data" /\\ SameValue(descriptor.value, object.values[key])

\\* A descriptor that changes a property between data and accessor keeps only its enumerable and
\\* configurable.
LOCAL Apply(object, key, descriptor) ==
  LET has(field) == field \\in descriptor.fields
      isNew == key \\notin DOMAIN object.values
      wasAccessor == ~isNew /\\ object.attributes[key].kind = "accessor"
      isKept ==
        ~isNew /\\ ~(descriptor.isAccessor /\\ ~wasAccessor) /\\ ~(descriptor.isData /\\ wasAccessor)
      isNowAccessor == IF isKept THEN wasAccessor ELSE descriptor.isAccessor
      current == IF isKept THEN object.values[key] ELSE [get |-> Undefined, set |-> Undefined]
      pick(field, kept) == IF has(field) THEN descriptor[field] ELSE kept
      flag(field) ==
        IF has(field) THEN descriptor[field] ELSE ~isNew /\\ object.attributes[key][field]
      value ==
        IF isNowAccessor
        THEN [get |-> pick("get", current.get), set |-> pick("set", current.set)]
        ELSE pick("value", IF isKept THEN object.values[key] ELSE Undefined)
  IN [object EXCEPT
        !.keys = IF isNew THEN Append(@, key) ELSE @,
        !.values = (key :> value) @@ @,
        !.attributes = (key :> [writable |-> ~isNowAccessor /\\ IF has("writable")
                                                               THEN descriptor.writable
                                                               ELSE isKept /\\ object.attributes[key].writable,
                                enumerable |-> flag("enumerable"),
                                configurable |-> flag("configurable"),
                                kind |-> CASE isNowAccessor -> "accessor"
                                           [] isKept /\\ ~has("value") -> object.attributes[key].kind
                                           [] OTHER -> "data"]) @@ @]

\\* A getter or setter of a class or an object literal, which keeps the other half of an accessor
\\* that it defined.
DefineAccessor(object, key, field, function, isEnumerable) ==
  Apply(object, key, [fields |-> {field, "enumerable", "configurable"}, isAccessor |-> TRUE,
                      isData |-> FALSE, isValid |-> TRUE, value |-> Undefined, get |-> function,
                      set |-> function, writable |-> FALSE, enumerable |-> isEnumerable,
                      configurable |-> TRUE])

LOCAL IsArrayObject(object) == "isArray" \\in DOMAIN object /\\ object.isArray

IsArray(heap, value) == IsRef(value) /\\ IsArrayObject(Lookup(heap, value))

\\* The built-in objects that have their own Symbol.toStringTag, by key, with its value.
LOCAL ToStringTags ==
  [key \\in {"Math", "JSON", "Reflect", "Atomics", "Symbol.prototype", "BigInt.prototype",
            "Map.prototype", "Set.prototype", "WeakMap.prototype", "WeakSet.prototype",
            "WeakRef.prototype", "FinalizationRegistry.prototype", "Promise.prototype",
            "ArrayBuffer.prototype", "SharedArrayBuffer.prototype", "DataView.prototype"} |->
     IF key \\in {"Math", "JSON", "Reflect", "Atomics"} THEN key ELSE SubSeq(key, 1, Len(key) - 10)]

\\* The built-in prototypes that have no Symbol.toStringTag of their own.
LOCAL UntaggedPrototypes ==
  {"Object.prototype", "Array.prototype", "Boolean.prototype", "Number.prototype",
   "String.prototype", "Date.prototype", "RegExp.prototype", "Error.prototype",
   "TypeError.prototype", "RangeError.prototype", "SyntaxError.prototype",
   "ReferenceError.prototype", "EvalError.prototype", "URIError.prototype",
   "AggregateError.prototype"}

\\* The Symbol.toStringTag that an object has or inherits, or "" where it has none. A script can't
\\* define symbol keys, so only built-in objects have one.
RECURSIVE TagOf(_, _)
TagOf(heap, ref) ==
  CASE ref = Null -> ""
    [] IsHeap(ref) -> TagOf(heap, Prototype(heap, ref))
    [] \\E key \\in DOMAIN ToStringTags : key = BuiltInKey(ref) -> ToStringTags[BuiltInKey(ref)]
    [] IsBuiltIn(ref) /\\ (Lookup(heap, ref).isCallable \\/ \\E key \\in UntaggedPrototypes : key = BuiltInKey(ref)) ->
         TagOf(heap, Prototype(heap, ref))
    [] OTHER -> Assert(FALSE, "tla-ts can't read the Symbol.toStringTag of " \\o ToString(ref))

\\* The kind that Object.prototype.toString gives an object without a Symbol.toStringTag.
LOCAL ClassOf(heap, ref) ==
  CASE IsHeap(ref) /\\ IsArrayObject(Lookup(heap, ref)) -> "Array"
    [] IsHeap(ref) /\\ "isArguments" \\in DOMAIN Lookup(heap, ref) -> "Arguments"
    [] IsHeap(ref) /\\ "primitive" \\in DOMAIN Lookup(heap, ref) ->
         CASE TypeOf(Lookup(heap, ref).primitive) = "boolean" -> "Boolean"
           [] TypeOf(Lookup(heap, ref).primitive) = "string" -> "String"
           [] OTHER -> "Number"
    [] IsHeap(ref) -> IF Lookup(heap, ref).isCallable THEN "Function" ELSE "Object"
    [] BuiltInKey(ref) = "Array.prototype" -> "Array"
    [] Lookup(heap, ref).isCallable -> "Function"
    [] BuiltInKey(ref) = "Boolean.prototype" -> "Boolean"
    [] BuiltInKey(ref) = "Number.prototype" -> "Number"
    [] BuiltInKey(ref) = "String.prototype" -> "String"
    [] OTHER -> "Object"

LOCAL Tagged(heap, ref, kind) == IF TagOf(heap, ref) = "" THEN kind ELSE TagOf(heap, ref)

\\* Object.prototype.toString, which gives "[object Kind]". A value that isn't on the heap gives the
\\* kind of object that holds it, such as Array for a sequence.
ObjectToString(heap, value, kind) ==
  "[object "
    \\o (CASE value = Undefined -> "Undefined"
          [] value = Null -> "Null"
          [] TypeOf(value) = "number" -> "Number"
          [] TypeOf(value) = "string" -> "String"
          [] TypeOf(value) = "boolean" -> "Boolean"
          [] ~IsRef(value) /\\ IsError(value) ->
               Tagged(heap, Get(heap, value.constructor, "prototype"), "Error")
          [] IsHeap(value) \\/ IsBuiltIn(value) -> Tagged(heap, value, ClassOf(heap, value))
          [] TypeOf(value) = "function" -> "Function"
          [] kind # "" -> kind
          [] OTHER -> Assert(FALSE, "tla-ts can't tell the kind of " \\o ToString(value)))
    \\o "]"

\\* ArraySpeciesCreate, which makes the array that a method returns through the constructor of the
\\* array that the method copies, where tla-ts follows only Array.
Species(constructor, array, elements) ==
  IF SameValue(constructor, array)
  THEN elements
  ELSE Assert(FALSE, "tla-ts can't make an array through a constructor that a script gives")

SpeciesElements(heap, ref, array, elements) ==
  IF IsArray(heap, ref) THEN Species(Get(heap, ref, "constructor"), array, elements) ELSE elements

\\* An array that a script makes, which holds its elements under their indices, and its length.
ArrayObject(prototype, elements) ==
  LET indices == {ToString(position - 1) : position \\in DOMAIN elements}
  IN [keys |-> [position \\in DOMAIN elements |-> ToString(position - 1)] \\o <<"length">>,
      values |-> [key \\in indices \\cup {"length"} |->
                   IF key = "length" THEN Len(elements) ELSE elements[ToIndex(key) + 1]],
      attributes |-> [key \\in indices \\cup {"length"} |->
                       IF key = "length"
                       THEN [Writable EXCEPT !.enumerable = FALSE, !.configurable = FALSE]
                       ELSE Writable],
      extensible |-> TRUE, prototype |-> prototype, isCallable |-> FALSE, isConstructor |-> FALSE,
      isOpaque |-> FALSE, privates |-> <<>>, isArray |-> TRUE]

\\* The arguments object of a call in strict mode, which holds the values the call gives under their
\\* indices, its length, and a callee that throws.
ArgumentsObject(elements, thrower) ==
  LET indices == {ToString(position - 1) : position \\in DOMAIN elements}
      callee == [writable |-> FALSE, enumerable |-> FALSE, configurable |-> FALSE, kind |-> "accessor"]
  IN [keys |-> [position \\in DOMAIN elements |-> ToString(position - 1)] \\o <<"length", "callee">>,
      values |-> [key \\in indices \\cup {"length", "callee"} |->
                   CASE key = "length" -> Len(elements)
                     [] key = "callee" -> [get |-> thrower, set |-> thrower]
                     [] OTHER -> elements[ToIndex(key) + 1]],
      attributes |-> [key \\in indices \\cup {"length", "callee"} |->
                       CASE key = "length" -> [Writable EXCEPT !.enumerable = FALSE]
                         [] key = "callee" -> callee
                         [] OTHER -> Writable],
      extensible |-> TRUE, prototype |-> ObjectPrototype, isCallable |-> FALSE,
      isConstructor |-> FALSE, isOpaque |-> FALSE, privates |-> <<>>, isArguments |-> TRUE]

\\* The object that new Boolean, new Number, or new String makes, which holds the primitive it wraps,
\\* and a string's characters under their indices and its length.
WrapperObject(prototype, primitive) ==
  LET isString == TypeOf(primitive) = "string"
      length == IF isString THEN Len(primitive) ELSE 0
      keys == IF isString THEN {ToString(position - 1) : position \\in 1..length} \\cup {"length"} ELSE {}
      fixed == [writable |-> FALSE, enumerable |-> FALSE, configurable |-> FALSE, kind |-> "data"]
  IN [keys |-> [position \\in 1..length |-> ToString(position - 1)]
               \\o (IF isString THEN <<"length">> ELSE <<>>),
      values |-> [key \\in keys |->
                   IF key = "length" THEN length ELSE SubSeq(primitive, ToIndex(key) + 1, ToIndex(key) + 1)],
      attributes |-> [key \\in keys |-> IF key = "length" THEN fixed ELSE [fixed EXCEPT !.enumerable = TRUE]],
      extensible |-> TRUE, prototype |-> prototype, isCallable |-> FALSE, isConstructor |-> FALSE,
      isOpaque |-> FALSE, privates |-> <<>>, primitive |-> primitive]

\\* The length that a value gives an array, or -1 where ArraySetLength throws a RangeError.
LOCAL ArrayLengthOf(value) ==
  CASE value = Null -> 0
    [] TypeOf(value) = "boolean" -> IF value THEN 1 ELSE 0
    [] TypeOf(value) = "string" ->
         ReadNumber(value, LAMBDA kind, isNegative, magnitude :
           IF kind = "integer" /\\ (~isNegative \\/ magnitude = 0) THEN magnitude ELSE -1)
    [] value = NegativeZero -> 0
    [] IsInteger(value) /\\ value >= 0 -> value
    [] IsNumber(value) \\/ value = Undefined -> -1
    [] OTHER -> Assert(FALSE, "tla-ts can't convert this value to an array length")

LOCAL Ordinary(object, key, descriptor) ==
  IF CanApply(object, key, descriptor)
  THEN [object |-> Apply(object, key, descriptor), isDone |-> TRUE, isRangeError |-> FALSE]
  ELSE [object |-> object, isDone |-> FALSE, isRangeError |-> FALSE]

\\* ArraySetLength, which deletes the elements past a smaller length, from the last, and stops at
\\* one it can't delete.
LOCAL SetLength(object, descriptor) ==
  LET length == ArrayLengthOf(descriptor.value)
      removed == {key \\in DOMAIN object.values : IsIndex(key) /\\ ToIndex(key) >= length}
      blocked == {ToIndex(key) : key \\in {other \\in removed : ~object.attributes[other].configurable}}
      kept == IF blocked = {} THEN length ELSE (CHOOSE index \\in blocked : \\A other \\in blocked : other <= index) + 1
      deleted == {key \\in removed : ToIndex(key) >= kept}
      remaining == DOMAIN object.values \\ deleted
      trimmed == [object EXCEPT !.keys = SelectSeq(@, LAMBDA key : key \\notin deleted),
                                !.values = [key \\in remaining |-> @[key]],
                                !.attributes = [key \\in remaining |-> @[key]]]
  IN CASE length < 0 -> [object |-> object, isDone |-> FALSE, isRangeError |-> TRUE]
       [] length >= object.values["length"] ->
            Ordinary(object, "length", [descriptor EXCEPT !.value = length])
       [] ~object.attributes["length"].writable -> [object |-> object, isDone |-> FALSE, isRangeError |-> FALSE]
       [] ~CanApply(object, "length", [descriptor EXCEPT !.value = length, !.writable = TRUE]) ->
            [object |-> object, isDone |-> FALSE, isRangeError |-> FALSE]
       [] OTHER ->
            [object |-> Apply(trimmed, "length", [descriptor EXCEPT !.value = kept]),
             isDone |-> blocked = {},
             isRangeError |-> FALSE]

\\* An object's [[DefineOwnProperty]], where an index past an array's end grows its length.
LOCAL DefineOwn(object, key, descriptor) ==
  CASE ~IsArrayObject(object) -> Ordinary(object, key, descriptor)
    [] key = "length" /\\ "value" \\in descriptor.fields -> SetLength(object, descriptor)
    [] IsIndex(key) ->
         LET length == object.values["length"]
             defined == Ordinary(object, key, descriptor)
         IN CASE ToIndex(key) >= length /\\ ~object.attributes["length"].writable ->
                   [object |-> object, isDone |-> FALSE, isRangeError |-> FALSE]
              [] ~defined.isDone \\/ ToIndex(key) < length -> defined
              [] OTHER -> [defined EXCEPT !.object.values["length"] = ToIndex(key) + 1]
    [] OTHER -> Ordinary(object, key, descriptor)

\\* The descriptor of a write, which changes a property's value or makes a writable one.
LOCAL WriteDescriptor(object, key, value) ==
  [fields |-> IF key \\in DOMAIN object.values
              THEN {"value"}
              ELSE {"value", "writable", "enumerable", "configurable"},
   isAccessor |-> FALSE, isData |-> TRUE, isValid |-> TRUE, value |-> value, get |-> Undefined,
   set |-> Undefined, writable |-> TRUE, enumerable |-> TRUE, configurable |-> TRUE]

SetProperty(heap, ref, key, value) ==
  LET accessor == AccessorOf(heap, ref, key)
      object == Lookup(heap, ref)
      written == DefineOwn(object, key, WriteDescriptor(object, key, value))
      failed == Assert(FALSE, "tla-ts can't throw the TypeError of a failed write")
  IN CASE ~CanPut(heap, ref, key) -> failed
       [] accessor = Undefined /\\ IsArrayObject(object) ->
            CASE written.isDone -> Update(heap, ref, written.object)
              [] written.isRangeError ->
                   Assert(FALSE, "tla-ts can't throw the RangeError of an invalid array length")
              [] OTHER -> failed
       [] accessor = Undefined -> Update(heap, ref, Put(object, key, value))
       [] accessor.set \\in DOMAIN ConstantFunctions -> heap
       [] OTHER -> Assert(FALSE, "tla-ts can't call setters")

RECURSIVE ApplyAll(_, _, _)
ApplyAll(object, keys, descriptors) ==
  IF keys = <<>>
  THEN [object |-> object, isDone |-> TRUE, isRangeError |-> FALSE]
  ELSE LET defined == DefineOwn(object, Head(keys), Head(descriptors))
       IN IF defined.isDone THEN ApplyAll(defined.object, Tail(keys), Tail(descriptors)) ELSE defined

\\* Whether a value is an object, where a function throws a TypeError if it isn't. An object that
\\* isn't in the heap, such as an array, stops the run.
LOCAL IsObjectArgument(value) ==
  CASE IsObject(value) -> TRUE
    [] value # Null /\\ TypeOf(value) = "object" ->
         Assert(FALSE, "tla-ts can't use " \\o ToString(value) \\o " as an object here")
    [] OTHER -> FALSE

\\* The values that tla-ts keeps outside the heap never read a built-in's accessors, but for an
\\* array, which reads Array.prototype past its end.
LOCAL CanDefineOn(ref, descriptor) ==
  Assert(\\/ IsHeap(ref)
         \\/ ~descriptor.isAccessor
         \\/ BuiltInKey(ref) \\in {"Array.prototype", "Object.prototype"},
         "tla-ts can't define accessors on built-in objects")

DefineProperty(heap, ref, key, descriptor) ==
  LET converted == ToDescriptor(heap, descriptor)
      applied == ApplyAll(Lookup(heap, ref), <<key>>, <<converted>>)
  IN IF /\\ IsObjectArgument(ref)
        /\\ IsObjectArgument(descriptor)
        /\\ converted.isValid
        /\\ CanDefineOn(ref, converted)
     THEN [heap |-> Update(heap, ref, applied.object), isDone |-> applied.isDone,
           isRangeError |-> applied.isRangeError]
     ELSE [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE]

DefineProperties(heap, ref, properties) ==
  LET source == Lookup(heap, properties)
      keys == EnumerableOwnKeys(source)
      values == [position \\in DOMAIN keys |-> Value(source, keys[position])]
  IN IF \\/ ~IsObjectArgument(ref)
        \\/ ~IsObjectArgument(properties)
        \\/ \\E position \\in DOMAIN keys : ~IsObjectArgument(values[position])
     THEN [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE]
     ELSE LET descriptors == [position \\in DOMAIN keys |-> ToDescriptor(heap, values[position])]
              applied == ApplyAll(Lookup(heap, ref), keys, descriptors)
          IN IF \\A position \\in DOMAIN keys :
                  descriptors[position].isValid /\\ CanDefineOn(ref, descriptors[position])
             THEN [heap |-> Update(heap, ref, applied.object), isDone |-> applied.isDone,
                   isRangeError |-> applied.isRangeError]
             ELSE [heap |-> heap, isDone |-> FALSE, isRangeError |-> FALSE]

Create(heap, prototype, properties) ==
  LET created == Allocate(heap, [EmptyObject EXCEPT !.prototype = prototype])
      change == DefineProperties(created, Allocated(created), properties)
  IN CASE ~(prototype = Null \\/ IsObjectArgument(prototype)) ->
            Assert(FALSE, "tla-ts can't throw the TypeError of Object.create")
       [] properties = Undefined -> created
       [] change.isDone -> change.heap
       [] OTHER -> Assert(FALSE, "tla-ts can't throw the TypeError of Object.create")

LOCAL Restrict(heap, ref, isFrozen) ==
  LET object == Lookup(heap, ref)
      attributes ==
        [key \\in DOMAIN object.attributes |->
          [object.attributes[key] EXCEPT !.configurable = FALSE,
                                         !.writable = IF isFrozen THEN FALSE ELSE @]]
  IN Update(heap, ref, [object EXCEPT !.extensible = FALSE, !.attributes = attributes])

PreventExtensions(heap, ref) == Update(heap, ref, [Lookup(heap, ref) EXCEPT !.extensible = FALSE])

Seal(heap, ref) == Restrict(heap, ref, FALSE)

Freeze(heap, ref) == Restrict(heap, ref, TRUE)

IsExtensible(heap, ref) == Lookup(heap, ref).extensible

IsSealed(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN ~object.extensible /\\ \\A key \\in DOMAIN object.attributes : ~object.attributes[key].configurable

IsFrozen(heap, ref) ==
  LET object == Lookup(heap, ref)
  IN /\\ IsSealed(heap, ref)
     /\\ \\A key \\in DOMAIN object.attributes :
          object.attributes[key].kind # "data" \\/ ~object.attributes[key].writable

===============================================================================`;

// The model values that stand for the numbers that TLA+ integers can't hold.
export const SPECIAL_NUMBERS = ["NaN", "Infinity", "NegativeInfinity", "NegativeZero"];

// The operators that the JavaScript module exports, which a spec that extends it can't redefine.
export const JAVASCRIPT_OPERATORS: ReadonlySet<string> = new Set([
  ...[...JAVASCRIPT_MODULE.matchAll(/^([A-Z]\w*)(?:\(| ==)/gm)].map((match) => match[1]),
  ...SPECIAL_NUMBERS,
]);

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
  if (flags & ts.TypeFlags.ESSymbolLike) return ["symbol"];
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
  // Object.defineProperty can give a property a value of another type than TypeScript's.
  const read = ts.isParenthesizedExpression(node.expression)
    ? node.expression.expression
    : node.expression;
  // An element of an array or a string may also lie past the end.
  const kind =
    ts.isPropertyAccessExpression(read) || ts.isElementAccessExpression(read)
      ? getKind(read.expression, context)
      : undefined;
  const isProperty =
    kind === "object" ||
    (ts.isElementAccessExpression(read) && (kind === "sequence" || kind === "string"));
  if (known?.length === 1 && !isProperty) return string(known[0]);
  if (context.modelValues.size > 0) {
    throw new TlaTypeScriptError("typeof can't tell a @symmetric value from a function", node);
  }
  const value = translateExpression(node.expression, scope, context);
  const heap = context.heap === undefined ? undefined : scope.bindings.get(context.heap);
  return heap === undefined
    ? useJavaScript("TypeOf", [value], context)
    : useJavaScript("TypeOfIn", [heap, value], context);
};

export const isComparableType = (left: ts.Type, right: ts.Type, checker: ts.TypeChecker) => {
  const names = [left, right].map((type) => getTypeNames(type, checker));
  if (names.some((name) => name === undefined)) return false;
  const kinds = new Set(
    names.flatMap((name) => name ?? []).filter((name) => name !== "null" && name !== "undefined"),
  );
  return kinds.size <= 1;
};

// Whether a value may be a number, which may be NaN or -0 in a script that names them.
export const mayBeNumber = (node: ts.Expression, context: Context) => {
  const names = getTypeNames(context.checker.getTypeAtLocation(node), context.checker);
  return names === undefined || names.includes("number");
};

export const isComparable = (left: ts.Expression, right: ts.Expression, context: Context) =>
  isComparableType(
    context.checker.getTypeAtLocation(left),
    context.checker.getTypeAtLocation(right),
    context.checker,
  );

const CONVERSIONS = new Set([
  "Boolean",
  "String",
  "Number",
  "parseInt",
  "parseFloat",
  "isNaN",
  "isFinite",
]);

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

// A call to Boolean, String, Number, parseInt, parseFloat, isNaN, or isFinite, or undefined for any
// other call.
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
  if (name === "isNaN") {
    context.prelude.add("JavaScript");
    return apply("=", [translateToNumber(argument, node, scope, context), identifier("NaN")]);
  }
  if (name === "isFinite") {
    return useJavaScript("IsFinite", [translateToNumber(argument, node, scope, context)], context);
  }
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
    if (kind === "number") {
      return context.hasSpecialNumbers
        ? useJavaScript("ToBoolean", [value], context)
        : apply("#", [value, number(0)]);
    }
    if (kind === "string") return apply("#", [value, string("")]);
    if (isEmpty || kind === "object" || kind === "function" || kind === "symbol") {
      return boolean(!isEmpty);
    }
  }
  if (name === "String") {
    if (kind === "string") return value;
    if (kind === "number") {
      return context.hasSpecialNumbers
        ? useJavaScript("StringOf", [value], context)
        : apply("ToString", [value]);
    }
    if (kind === "boolean") return ifExpression(value, string("true"), string("false"));
    if (isEmpty) return string(kind);
    const heap = context.heap === undefined ? undefined : scope.bindings.get(context.heap);
    if (kind === "symbol" && heap !== undefined) {
      return useJavaScript("SymbolString", [heap, value], context);
    }
    if (names === undefined) return useJavaScript("StringOf", [value], context);
  }
  throw unsupported;
};
