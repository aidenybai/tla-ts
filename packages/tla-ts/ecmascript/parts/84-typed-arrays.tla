\* TypedArrays (§10.4.5, §23.2). A TypedArray has class "typedArray" and slots:
\*   buffer       [[ViewedArrayBuffer]]
\*   name         [[TypedArrayName]], such as "Int8Array"
\*   byteLength   [[ByteLength]], or Empty for ~auto~
\*   byteOffset   [[ByteOffset]]
\*   arrayLength  [[ArrayLength]], or Empty for ~auto~
\* Its [[ContentType]] follows from its name. With a single agent a buffer's byte length can't
\* change between two reads, so the TypedArray With Buffer Witness Records aren't kept: the
\* operations read the buffer's byte length from the state.

\* The TypedArray constructors (Table 71).
TypedArrayNames ==
  << "Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array",
     "BigInt64Array", "BigUint64Array", "Float16Array", "Float32Array", "Float64Array" >>
TypedArrayElementType(name) ==
  CASE name = "Int8Array" -> "int8" [] name = "Uint8Array" -> "uint8" [] name = "Uint8ClampedArray" -> "uint8clamped"
    [] name = "Int16Array" -> "int16" [] name = "Uint16Array" -> "uint16" [] name = "Int32Array" -> "int32"
    [] name = "Uint32Array" -> "uint32" [] name = "BigInt64Array" -> "bigint64" [] name = "BigUint64Array" -> "biguint64"
    [] name = "Float16Array" -> "float16" [] name = "Float32Array" -> "float32" [] name = "Float64Array" -> "float64"
TypedArrayNameUnits(name) ==
  CASE name = "Int8Array" -> N("Int8Array") [] name = "Uint8Array" -> N("Uint8Array")
    [] name = "Uint8ClampedArray" -> N("Uint8ClampedArray") [] name = "Int16Array" -> N("Int16Array")
    [] name = "Uint16Array" -> N("Uint16Array") [] name = "Int32Array" -> N("Int32Array")
    [] name = "Uint32Array" -> N("Uint32Array") [] name = "BigInt64Array" -> N("BigInt64Array")
    [] name = "BigUint64Array" -> N("BigUint64Array") [] name = "Float16Array" -> N("Float16Array")
    [] name = "Float32Array" -> N("Float32Array") [] name = "Float64Array" -> N("Float64Array")

IsTypedArray(s, v) == IsObject(v) /\ O(s, v).class = "typedArray"
TypedArrayType(s, ta) == TypedArrayElementType(O(s, ta).slots.name)
TypedArraySize(s, ta) == ElementSize(TypedArrayType(s, ta))
IsBigIntTypedArray(s, ta) == IsBigIntElementType(TypedArrayType(s, ta))

\* IsTypedArrayOutOfBounds (§10.4.5.12).
IsTypedArrayOutOfBounds(s, ta) ==
  LET o == O(s, ta).slots IN
  IF IsDetachedBuffer(s, o.buffer) THEN TRUE
  ELSE LET bufferByteLength == ArrayBufferByteLength(s, o.buffer)
           end == IF o.arrayLength = Empty THEN bufferByteLength
                  ELSE o.byteOffset + o.arrayLength * TypedArraySize(s, ta)
       IN o.byteOffset > bufferByteLength \/ end > bufferByteLength

\* TypedArrayLength (§10.4.5.11) and TypedArrayByteLength (§10.4.5.10).
TypedArrayLength(s, ta) ==
  LET o == O(s, ta).slots IN
  IF o.arrayLength # Empty THEN o.arrayLength
  ELSE (ArrayBufferByteLength(s, o.buffer) - o.byteOffset) \div TypedArraySize(s, ta)
TypedArrayByteLength(s, ta) ==
  IF O(s, ta).slots.byteLength # Empty THEN O(s, ta).slots.byteLength
  ELSE TypedArrayLength(s, ta) * TypedArraySize(s, ta)

\* IsTypedArrayFixedLength (§10.4.5.13).
IsFixedLengthTypedArray(s, ta) ==
  LET o == O(s, ta).slots IN
  o.arrayLength # Empty /\ (IsFixedLengthArrayBuffer(s, o.buffer) \/ IsSharedArrayBuffer(s, o.buffer))

\* IsValidIntegerIndex (§10.4.5.14), for index a Number.
IsValidIntegerIndex(s, ta, index) ==
  /\ ~IsDetachedBuffer(s, O(s, ta).slots.buffer)
  /\ NumIsIntegral(index)
  /\ ~index.neg
  /\ ~IsTypedArrayOutOfBounds(s, ta)
  /\ NumLess(index, NumFromInt(TypedArrayLength(s, ta)))

\* TypedArrayGetElement (§10.4.5.15).
TypedArrayGetElement(s, ta, index) ==
  IF ~IsValidIntegerIndex(s, ta, index) THEN Undefined
  ELSE GetValueFromBuffer(s, O(s, ta).slots.buffer, index.i * TypedArraySize(s, ta) + O(s, ta).slots.byteOffset,
                          TypedArrayType(s, ta), LittleEndian)

\* The last steps of TypedArraySetElement, for a value already a Number or BigInt.
TypedArrayStore(s, ta, index, numeric) ==
  IF ~IsValidIntegerIndex(s, ta, index) THEN s
  ELSE SetValueInBuffer(s, O(s, ta).slots.buffer, index.i * TypedArraySize(s, ta) + O(s, ta).slots.byteOffset,
                        TypedArrayType(s, ta), numeric, LittleEndian)

\* TypedArraySetElement (§10.4.5.16).
TypedArraySetElement(s, ta, index, v) ==
  LET n == IF IsBigIntTypedArray(s, ta) THEN ToBigInt(s, v) ELSE ToNumber(s, v) IN
  IF IsAbrupt(n) THEN n ELSE Ok(TypedArrayStore(n.s, ta, index, Val(n)), Undefined)

\* The TypedArray internal methods (§10.4.5.1 to §10.4.5.8) for a key k that is a canonical numeric
\* string, which CanonicalIndex turns into its Number.
IsTypedArrayKey(k) == IsString(k) /\ CanonicalNumericIndexString(k.value) # Undefined
CanonicalIndex(k) == CanonicalNumericIndexString(k.value).value

TypedArrayGetOwnProperty(s, ta, k) ==
  LET v == TypedArrayGetElement(s, ta, CanonicalIndex(k)) IN
  LET isMutable == ~IsImmutableBuffer(s, O(s, ta).slots.buffer) IN
  IF v = Undefined THEN Absent ELSE DataDesc(v, isMutable, TRUE, isMutable)

TypedArrayDefineOwnProperty(s, ta, k, d) ==
  LET index == CanonicalIndex(k) IN
  IF ~IsValidIntegerIndex(s, ta, index) THEN Ok(s, False)
  ELSE IF IsImmutableBuffer(s, O(s, ta).slots.buffer)
  THEN Ok(s, Bool(IsCompatiblePropertyDescriptor(FALSE, d, TypedArrayGetOwnProperty(s, ta, k))))
  ELSE IF d.configurable = False \/ d.enumerable = False \/ IsAccessorDescriptor(d) \/ d.writable = False THEN Ok(s, False)
  ELSE IF d.value = Absent THEN Ok(s, True)
  ELSE LET r == TypedArraySetElement(s, ta, index, d.value) IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, True)

TypedArraySet(s, ta, k, value, receiver) ==
  LET index == CanonicalIndex(k) IN
  IF IsImmutableBuffer(s, O(s, ta).slots.buffer) THEN Ok(s, False)
  ELSE IF SameValue(ta, receiver) THEN
    LET r == TypedArraySetElement(s, ta, index, value) IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, True)
  ELSE IF ~IsValidIntegerIndex(s, ta, index) THEN Ok(s, True)
  ELSE OrdinarySet(s, ta, k, value, receiver)

TypedArrayOwnPropertyKeys(s, ta) ==
  LET length == IF IsTypedArrayOutOfBounds(s, ta) THEN 0 ELSE TypedArrayLength(s, ta)
      keys == O(s, ta).keys
  IN [i \in 1..length |-> Index(NumFromInt(i - 1))] \o SelectSeq(keys, IsString) \o SelectSeq(keys, IsSymbol)

\* ValidateTypedArray (§23.2.4.4) and ValidateTypedArrayBounds, with the length as the value.
\* ValidateTypedArrayForWrite is ValidateTypedArray with accessMode write, which rejects a view of
\* an immutable buffer (proposal-immutable-arraybuffer).
ValidateTypedArray(s, v) == IF ~IsTypedArray(s, v) THEN ThrowTypeError(s) ELSE ValidateTypedArrayBounds(s, v)
ValidateTypedArrayForWrite(s, v) ==
  IF IsTypedArray(s, v) /\ IsImmutableBuffer(s, O(s, v).slots.buffer) THEN ThrowTypeError(s) ELSE ValidateTypedArray(s, v)
ValidateTypedArrayBounds(s, ta) ==
  IF IsTypedArrayOutOfBounds(s, ta) THEN ThrowTypeError(s) ELSE Ok(s, TypedArrayLength(s, ta))

\* TypedArrayCreateFromConstructor (§23.2.4.1), for a result to read from or to write to.
TypedArrayCreateFromConstructor(s, ctor, argList, isWrite) ==
  LET ta == Construct(s, ctor, argList, ctor) IN IF IsAbrupt(ta) THEN ta ELSE
  LET len == IF isWrite THEN ValidateTypedArrayForWrite(ta.s, Val(ta)) ELSE ValidateTypedArray(ta.s, Val(ta)) IN
  IF IsAbrupt(len) THEN len
  ELSE IF Len(argList) = 1 /\ IsNumber(argList[1]) /\ NumLess(NumFromInt(Val(len)), argList[1].value)
  THEN ThrowTypeError(len.s)
  ELSE Ok(len.s, Val(ta))

\* TypedArrayCreateSameType (§23.2.4.2) and TypedArraySpeciesCreate (§23.2.4.3).
TypedArrayCreateSameType(s, exemplar, length) ==
  TypedArrayCreateFromConstructor(s, Intrinsic(s, O(s, exemplar).slots.name), <<IntV(length)>>, FALSE)
TypedArraySpeciesCreate(s, exemplar, argList, isWrite) ==
  LET c == SpeciesConstructor(s, exemplar, Intrinsic(s, O(s, exemplar).slots.name)) IN IF IsAbrupt(c) THEN c ELSE
  LET r == TypedArrayCreateFromConstructor(c.s, Val(c), argList, isWrite) IN
  IF IsAbrupt(r) THEN r
  ELSE IF IsBigIntTypedArray(r.s, Val(r)) # IsBigIntTypedArray(r.s, exemplar) THEN ThrowTypeError(r.s)
  ELSE r

\* AllocateTypedArray (§23.2.5.1.1), with length a Number, or Empty for none.
AllocateTypedArray(s, name, newTarget, length) ==
  LET p == GetPrototypeFromConstructor(s, newTarget, name \o "Prototype") IN
  IF IsAbrupt(p) THEN p
  ELSE LET a == Alloc(p.s, MakeObject(Val(p), "typedArray",
                        [buffer |-> Undefined, name |-> name, byteLength |-> 0, byteOffset |-> 0, arrayLength |-> 0]))
       IN IF length = Empty THEN Ok(a.s, a.v)
          ELSE LET r == AllocateTypedArrayBuffer(a.s, a.v, length) IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, a.v)

\* Sets a TypedArray's buffer and its view of it.
SetView(s, ta, buffer, byteLength, byteOffset, arrayLength) ==
  SetO(s, ta, [O(s, ta) EXCEPT !.slots.buffer = buffer, !.slots.byteLength = byteLength,
                               !.slots.byteOffset = byteOffset, !.slots.arrayLength = arrayLength])

\* AllocateTypedArrayBuffer (§23.2.5.1.6), with length a Number.
AllocateTypedArrayBuffer(s, ta, length) ==
  LET size == TypedArraySize(s, ta)
      data == AllocateBuffer(s, Intrinsic(s, "ArrayBuffer"), NumMul(NumFromInt(size), length), Empty, FALSE)
  IN IF IsAbrupt(data) THEN data
     ELSE Ok(SetView(data.s, ta, Val(data), size * NumToSmallInt(length), 0, NumToSmallInt(length)), Undefined)

\* Copies count elements from one buffer to another, converting each from one element type to
\* another.
CopyConverted(s, from, fromIndex, fromType, to, toIndex, toType, count) ==
  IF count <= 0 THEN s
  ELSE CopyConverted(SetValueInBuffer(s, to, toIndex, toType, GetValueFromBuffer(s, from, fromIndex, fromType, LittleEndian),
                                      LittleEndian),
                     from, fromIndex + ElementSize(fromType), fromType, to, toIndex + ElementSize(toType), toType, count - 1)

\* InitializeTypedArrayFromTypedArray (§23.2.5.1.2).
InitializeTypedArrayFromTypedArray(s, ta, source) ==
  LET elementType == TypedArrayType(s, ta)
      sourceType == TypedArrayType(s, source)
      sourceSlots == O(s, source).slots
  IN IF IsTypedArrayOutOfBounds(s, source) THEN ThrowTypeError(s)
     ELSE LET length == TypedArrayLength(s, source)
              byteLength == ElementSize(elementType) * length
              data == IF elementType = sourceType
                      THEN CloneArrayBuffer(s, sourceSlots.buffer, sourceSlots.byteOffset, byteLength)
                      ELSE AllocateBuffer(s, Intrinsic(s, "ArrayBuffer"), NumFromInt(byteLength), Empty, FALSE)
          IN IF IsAbrupt(data) THEN data
             ELSE IF IsBigIntElementType(elementType) # IsBigIntElementType(sourceType) THEN ThrowTypeError(data.s)
             ELSE LET filled == IF elementType = sourceType THEN data.s
                                ELSE CopyConverted(data.s, sourceSlots.buffer, sourceSlots.byteOffset, sourceType,
                                                   Val(data), 0, elementType, length)
                  IN Ok(SetView(filled, ta, Val(data), byteLength, 0, length), Undefined)

\* InitializeTypedArrayFromArrayBuffer (§23.2.5.1.3).
InitializeTypedArrayFromArrayBuffer(s, ta, buffer, byteOffset, length) ==
  LET size == TypedArraySize(s, ta)
      off == ToIndex(s, byteOffset)
  IN IF IsAbrupt(off) THEN off
     ELSE IF ~NumIsZero(NumRemainder(Val(off).value, NumFromInt(size))) THEN ThrowError(off.s, "RangeError")
     ELSE LET newLength == IF length = Undefined THEN Ok(off.s, Empty) ELSE ToIndex(off.s, length) IN
     IF IsAbrupt(newLength) THEN newLength
     ELSE IF IsDetachedBuffer(newLength.s, buffer) THEN ThrowTypeError(newLength.s)
     ELSE LET t == newLength.s
              bufferByteLength == ArrayBufferByteLength(t, buffer)
              offset == Val(off).value
          IN IF NumLess(NumFromInt(bufferByteLength), offset) THEN ThrowError(t, "RangeError")
             ELSE IF length = Undefined /\ ~IsFixedLengthArrayBuffer(t, buffer)
             THEN Ok(SetView(t, ta, buffer, Empty, NumToSmallInt(offset), Empty), Undefined)
             ELSE IF length = Undefined THEN
               IF bufferByteLength % size # 0 THEN ThrowError(t, "RangeError")
               ELSE LET byteLength == bufferByteLength - NumToSmallInt(offset)
                    IN Ok(SetView(t, ta, buffer, byteLength, NumToSmallInt(offset), byteLength \div size), Undefined)
             ELSE IF NumLess(NumFromInt(bufferByteLength), Val(newLength).value) \/
                     NumToSmallInt(offset) + NumToSmallInt(Val(newLength).value) * size > bufferByteLength
             THEN ThrowError(t, "RangeError")
             ELSE LET elements == NumToSmallInt(Val(newLength).value)
                  IN Ok(SetView(t, ta, buffer, elements * size, NumToSmallInt(offset), elements), Undefined)

\* InitializeTypedArrayFromElements (§23.2.5.1.5), which InitializeTypedArrayFromList and the
\* array-like case share.
InitializeTypedArrayFromElements(s, ta, source) ==
  LET using == GetMethod(s, source, SymIterator) IN
  IF IsAbrupt(using) THEN using
  ELSE IF Val(using) # Undefined THEN
    LET it == GetIteratorFromMethod(using.s, source, Val(using)) IN IF IsAbrupt(it) THEN it ELSE
    LET list == IteratorToList(it.s, Val(it), <<>>) IN IF IsAbrupt(list) THEN list ELSE
    LET b == AllocateTypedArrayBuffer(list.s, ta, NumFromInt(Len(Val(list)))) IN IF IsAbrupt(b) THEN b
    ELSE TypedArraySetElements(b.s, ta, Val(list), Empty, 0, Len(Val(list)), Undefined, Undefined)
  ELSE LET len == LengthOfArrayLike(using.s, source) IN IF IsAbrupt(len) THEN len ELSE
       LET b == AllocateTypedArrayBuffer(len.s, ta, Val(len).value) IN IF IsAbrupt(b) THEN b
       ELSE TypedArraySetElements(b.s, ta, Empty, source, 0, NumToSmallInt(Val(len).value), Undefined, Undefined)

\* Sets the elements k up to len of ta from the list values, or else from the array-like source,
\* each mapped by mapper unless it is Undefined. SetElementsRun takes at most 2^depth steps nested
\* depth deep, so a long list needs no frame per element.
TypedArraySetElements(s, ta, values, source, k, len, mapper, thisArg) ==
  SetElementsFrom(s, [ta |-> ta, values |-> values, source |-> source, len |-> len, mapper |-> mapper, thisArg |-> thisArg], k, 0)
SetElementsStep(s, loop, k) ==
  IF k >= loop.len THEN Ok(s, loop.ta)
  ELSE LET v == IF loop.values # Empty THEN Ok(s, loop.values[k + 1]) ELSE Get(s, loop.source, Index(NumFromInt(k))) IN
       IF IsAbrupt(v) THEN v ELSE
       LET mapped == IF loop.mapper = Undefined THEN v ELSE Call(v.s, loop.mapper, loop.thisArg, <<Val(v), IntV(k)>>) IN
       IF IsAbrupt(mapped) THEN mapped ELSE
       LET w == TypedArraySetElement(mapped.s, loop.ta, NumFromInt(k), Val(mapped)) IN
       IF IsAbrupt(w) THEN w ELSE [s |-> w.s, c |-> Completion("iterate", k + 1, Empty)]
SetElementsRun(s, loop, k, depth) ==
  IF depth = 0 THEN SetElementsStep(s, loop, k)
  ELSE LET r == SetElementsRun(s, loop, k, depth - 1) IN
       IF r.c.type = "iterate" THEN SetElementsRun(r.s, loop, Val(r), depth - 1) ELSE r
SetElementsFrom(s, loop, k, depth) ==
  LET r == SetElementsRun(s, loop, k, depth) IN
  IF r.c.type = "iterate" THEN SetElementsFrom(r.s, loop, Val(r), depth + 1) ELSE r

\* The TypedArray constructors (§23.2.5.1).
TypedArrayConstruct(s, name, args, nt) ==
  IF nt = Undefined THEN ThrowTypeError(s)
  ELSE IF args = <<>> THEN AllocateTypedArray(s, name, nt, PosZero)
  ELSE IF IsObject(args[1]) THEN
    LET first == args[1]
        obj == AllocateTypedArray(s, name, nt, Empty)
    IN IF IsAbrupt(obj) THEN obj ELSE
       LET r == CASE O(obj.s, first).class = "typedArray" -> InitializeTypedArrayFromTypedArray(obj.s, Val(obj), first)
                  [] O(obj.s, first).class = "arrayBuffer" ->
                       InitializeTypedArrayFromArrayBuffer(obj.s, Val(obj), first, Arg(args, 2), Arg(args, 3))
                  [] OTHER -> InitializeTypedArrayFromElements(obj.s, Val(obj), first)
       IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(obj))
  ELSE LET n == ToIndex(s, args[1]) IN IF IsAbrupt(n) THEN n ELSE AllocateTypedArray(n.s, name, nt, Val(n).value)

\* %TypedArray%.from (§23.2.2.1).
TypedArrayFrom(s, ctor, source, mapper, thisArg) ==
  IF ~IsConstructor(s, ctor) THEN ThrowTypeError(s)
  ELSE IF mapper # Undefined /\ ~IsCallable(s, mapper) THEN ThrowTypeError(s)
  ELSE LET using == GetMethod(s, source, SymIterator) IN
  IF IsAbrupt(using) THEN using
  ELSE IF Val(using) # Undefined THEN
    LET it == GetIteratorFromMethod(using.s, source, Val(using)) IN IF IsAbrupt(it) THEN it ELSE
    LET values == IteratorToList(it.s, Val(it), <<>>) IN IF IsAbrupt(values) THEN values ELSE
    LET target == TypedArrayCreateFromConstructor(values.s, ctor, <<IntV(Len(Val(values)))>>, TRUE) IN
    IF IsAbrupt(target) THEN target
    ELSE TypedArraySetElements(target.s, Val(target), Val(values), Empty, 0, Len(Val(values)), mapper, thisArg)
  ELSE LET arrayLike == ToObject(using.s, source) IN
       LET len == LengthOfArrayLike(arrayLike.s, Val(arrayLike)) IN IF IsAbrupt(len) THEN len ELSE
       LET target == TypedArrayCreateFromConstructor(len.s, ctor, <<Val(len)>>, TRUE) IN
       IF IsAbrupt(target) THEN target
       ELSE TypedArraySetElements(target.s, Val(target), Empty, Val(arrayLike), 0, NumToSmallInt(Val(len).value), mapper, thisArg)

\* SetTypedArrayFromTypedArray (§23.2.3.26.2), with targetOffset a Number.
SetTypedArrayFromTypedArray(s, target, targetOffset, source) ==
  LET targetLength == ValidateTypedArrayBounds(s, target) IN IF IsAbrupt(targetLength) THEN targetLength ELSE
  LET sourceLength == ValidateTypedArrayBounds(targetLength.s, source) IN IF IsAbrupt(sourceLength) THEN sourceLength
  ELSE IF targetOffset = PosInf \/
          NumLess(NumFromInt(Val(targetLength)), NumAdd(NumFromInt(Val(sourceLength)), targetOffset))
  THEN ThrowError(sourceLength.s, "RangeError")
  ELSE IF IsBigIntTypedArray(s, target) # IsBigIntTypedArray(s, source) THEN ThrowTypeError(sourceLength.s)
  ELSE LET t == sourceLength.s
           sourceSlots == O(t, source).slots
           targetSlots == O(t, target).slots
           isSameBuffer == SameValue(sourceSlots.buffer, targetSlots.buffer)
           clone == IF isSameBuffer
                    THEN CloneArrayBuffer(t, sourceSlots.buffer, sourceSlots.byteOffset, TypedArrayByteLength(t, source))
                    ELSE Ok(t, sourceSlots.buffer)
       IN IF IsAbrupt(clone) THEN clone ELSE
          LET sourceIndex == IF isSameBuffer THEN 0 ELSE sourceSlots.byteOffset
              targetSize == TypedArraySize(t, target)
              targetIndex == NumToSmallInt(targetOffset) * targetSize + targetSlots.byteOffset
              count == Val(sourceLength)
          IN Ok(IF TypedArrayType(t, source) = TypedArrayType(t, target)
                THEN SetBufferBytes(clone.s, targetSlots.buffer, targetIndex,
                                    BufferBytes(clone.s, Val(clone), sourceIndex, targetSize * count))
                ELSE CopyConverted(clone.s, Val(clone), sourceIndex, TypedArrayType(t, source),
                                   targetSlots.buffer, targetIndex, TypedArrayType(t, target), count),
                Undefined)

\* SetTypedArrayFromArrayLike (§23.2.3.26.1), with targetOffset a Number.
SetTypedArrayFromArrayLike(s, target, targetOffset, source) ==
  LET targetLength == ValidateTypedArrayBounds(s, target) IN IF IsAbrupt(targetLength) THEN targetLength ELSE
  LET src == ToObject(targetLength.s, source) IN IF IsAbrupt(src) THEN src ELSE
  LET sourceLength == LengthOfArrayLike(src.s, Val(src)) IN IF IsAbrupt(sourceLength) THEN sourceLength
  ELSE IF targetOffset = PosInf \/
          NumLess(NumFromInt(Val(targetLength)), NumAdd(Val(sourceLength).value, targetOffset))
  THEN ThrowError(sourceLength.s, "RangeError")
  ELSE SetFromArrayLike(sourceLength.s, target, NumToSmallInt(targetOffset), Val(src), 0,
                        NumToSmallInt(Val(sourceLength).value))
SetFromArrayLike(s, target, offset, source, k, len) ==
  IF k >= len THEN Ok(s, Undefined)
  ELSE LET v == Get(s, source, Index(NumFromInt(k))) IN IF IsAbrupt(v) THEN v ELSE
       LET w == TypedArraySetElement(v.s, target, NumFromInt(offset + k), Val(v)) IN
       IF IsAbrupt(w) THEN w ELSE SetFromArrayLike(w.s, target, offset, source, k + 1, len)

\* %TypedArray%.prototype.subarray (§23.2.3.30).
TypedArraySubarray(s, ta, start, end) ==
  IF ~IsTypedArray(s, ta) THEN ThrowTypeError(s)
  ELSE LET sourceLength == IF IsTypedArrayOutOfBounds(s, ta) THEN 0 ELSE TypedArrayLength(s, ta)
           first == ToClampedIndex(s, start, sourceLength)
       IN IF IsAbrupt(first) THEN first ELSE
          LET slots == O(first.s, ta).slots
              begin == IntV(slots.byteOffset + Val(first) * TypedArraySize(first.s, ta))
          IN IF slots.arrayLength = Empty /\ end = Undefined
             THEN TypedArraySpeciesCreate(first.s, ta, <<slots.buffer, begin>>, FALSE)
             ELSE LET final == IF end = Undefined THEN Ok(first.s, sourceLength) ELSE ToClampedIndex(first.s, end, sourceLength) IN
                  IF IsAbrupt(final) THEN final
                  ELSE TypedArraySpeciesCreate(final.s, ta, <<slots.buffer, begin, IntV(IntegerMax(Val(final) - Val(first), 0))>>, FALSE)

\* The loops of every, some, forEach, find, findIndex, findLast, and findLastIndex (§23.2.3), which
\* visit k upward or, for findLast and findLastIndex, downward.
TypedArrayVisit(s, ta, len, k, m, callback, thisArg) ==
  IF k >= len \/ k < 0 THEN
    Ok(s, CASE m = "every" -> True [] m = "some" -> False [] m \in {"findIndex", "findLastIndex"} -> IntV(-1)
            [] OTHER -> Undefined)
  ELSE LET v == TypedArrayGetElement(s, ta, NumFromInt(k))
           r == Call(s, callback, thisArg, <<v, IntV(k), ta>>)
       IN IF IsAbrupt(r) THEN r
          ELSE IF m = "every" /\ ~ToBooleanValue(Val(r)) THEN Ok(r.s, False)
          ELSE IF m = "some" /\ ToBooleanValue(Val(r)) THEN Ok(r.s, True)
          ELSE IF m \in {"find", "findLast"} /\ ToBooleanValue(Val(r)) THEN Ok(r.s, v)
          ELSE IF m \in {"findIndex", "findLastIndex"} /\ ToBooleanValue(Val(r)) THEN Ok(r.s, IntV(k))
          ELSE TypedArrayVisit(r.s, ta, len, IF m \in {"findLast", "findLastIndex"} THEN k - 1 ELSE k + 1, m, callback, thisArg)

\* The elements of filter that callback selects.
FilterFrom(s, ta, len, k, callback, thisArg, kept) ==
  IF k >= len THEN Ok(s, kept)
  ELSE LET v == TypedArrayGetElement(s, ta, NumFromInt(k))
           r == Call(s, callback, thisArg, <<v, IntV(k), ta>>)
       IN IF IsAbrupt(r) THEN r
          ELSE FilterFrom(r.s, ta, len, k + 1, callback, thisArg, IF ToBooleanValue(Val(r)) THEN Append(kept, v) ELSE kept)

MapFromTypedArray(s, ta, target, k, len, callback, thisArg) ==
  IF k >= len THEN Ok(s, target)
  ELSE LET v == Call(s, callback, thisArg, <<TypedArrayGetElement(s, ta, NumFromInt(k)), IntV(k), ta>>) IN
       IF IsAbrupt(v) THEN v ELSE
       LET w == TypedArraySetElement(v.s, target, NumFromInt(k), Val(v)) IN
       IF IsAbrupt(w) THEN w ELSE MapFromTypedArray(w.s, ta, target, k + 1, len, callback, thisArg)

ReduceFrom(s, ta, len, k, step, callback, accumulator) ==
  IF k < 0 \/ k >= len THEN Ok(s, accumulator)
  ELSE LET r == Call(s, callback, Undefined, <<accumulator, TypedArrayGetElement(s, ta, NumFromInt(k)), IntV(k), ta>>) IN
       IF IsAbrupt(r) THEN r ELSE ReduceFrom(r.s, ta, len, k + step, step, callback, Val(r))

\* Stores values[k + 1] onwards into ta from index k. StoreRun stores at most 2^depth values nested
\* depth deep, so a long list needs no frame per element.
StoreElements(s, ta, values, k) == StoreFrom(s, ta, values, k, 0)
StoreRun(s, ta, values, k, depth) ==
  CASE k >= Len(values) -> [s |-> s, k |-> k]
    [] depth = 0 -> [s |-> TypedArrayStore(s, ta, NumFromInt(k), values[k + 1]), k |-> k + 1]
    [] OTHER -> LET r == StoreRun(s, ta, values, k, depth - 1) IN StoreRun(r.s, ta, values, r.k, depth - 1)
StoreFrom(s, ta, values, k, depth) ==
  IF k >= Len(values) THEN s
  ELSE LET r == StoreRun(s, ta, values, k, depth) IN StoreFrom(r.s, ta, values, r.k, depth + 1)
TypedArrayElements(s, ta, len) == [i \in 1..len |-> TypedArrayGetElement(s, ta, NumFromInt(i - 1))]

\* The first index from k up, or the last from k down, of an element strictly equal to target,
\* or -1.
StrictIndexFrom(s, ta, target, k, len, step) ==
  IF k < 0 \/ k >= len THEN -1
  ELSE IF IsValidIntegerIndex(s, ta, NumFromInt(k)) /\ IsStrictlyEqual(target, TypedArrayGetElement(s, ta, NumFromInt(k)))
  THEN k
  ELSE StrictIndexFrom(s, ta, target, k + step, len, step)

\* JoinIndexedProperties (§23.1.3.18.1) on a TypedArray, whose elements convert to strings without
\* running code.
JoinElements(s, ta, k, len, separator) ==
  IF k >= len THEN <<>>
  ELSE LET e == TypedArrayGetElement(s, ta, NumFromInt(k))
       IN (IF k > 0 THEN separator ELSE <<>>) \o (IF e = Undefined THEN <<>> ELSE PrimitiveToUnits(e)) \o
          JoinElements(s, ta, k + 1, len, separator)

\* JoinIndexedProperties with the method "toLocaleString", and "," as the list separator.
LocaleJoin(s, ta, k, len, acc) ==
  IF k >= len THEN Ok(s, Str(acc))
  ELSE LET prefix == IF k > 0 THEN acc \o N(",") ELSE acc
           e == TypedArrayGetElement(s, ta, NumFromInt(k))
       IN IF e = Undefined THEN LocaleJoin(s, ta, k + 1, len, prefix)
          ELSE LET r == Invoke(s, e, SV("toLocaleString"), <<>>) IN IF IsAbrupt(r) THEN r ELSE
               LET str == ToStr(r.s, Val(r)) IN IF IsAbrupt(str) THEN str
               ELSE LocaleJoin(str.s, ta, k + 1, len, prefix \o Val(str).value)

\* Copies count bytes one at a time upward, as slice does between two TypedArrays of a type. That
\* copies them all at once unless the target starts within the bytes still to copy.
CopyBytesUp(s, from, fromIndex, to, toIndex, count) ==
  CASE count <= 0 -> s
    [] from # to \/ toIndex <= fromIndex \/ toIndex >= fromIndex + count ->
         SetBufferBytes(s, to, toIndex, BufferBytes(s, from, fromIndex, count))
    [] OTHER -> CopyBytesUp(SetBufferBytes(s, to, toIndex, BufferBytes(s, from, fromIndex, 1)),
                            from, fromIndex + 1, to, toIndex + 1, count - 1)

\* CompareTypedArrayElements (§23.2.4.7), as a Number.
CompareTypedArrayElements(s, x, y, comparator) ==
  IF comparator # Undefined THEN
    LET r == Call(s, comparator, Undefined, <<x, y>>) IN IF IsAbrupt(r) THEN r ELSE
    LET n == ToNumber(r.s, Val(r)) IN IF IsAbrupt(n) THEN n
    ELSE Ok(n.s, IF NumIsNaN(Val(n).value) THEN PosZero ELSE Val(n).value)
  ELSE Ok(s, CASE IsBigInt(x) ->
                    IF BigIntLess(x.value, y.value) THEN NumFromInt(-1)
                    ELSE IF BigIntLess(y.value, x.value) THEN OneNum ELSE PosZero
               [] NumIsNaN(x.value) /\ NumIsNaN(y.value) -> PosZero
               [] NumIsNaN(x.value) -> OneNum
               [] NumIsNaN(y.value) -> NumFromInt(-1)
               [] NumLess(x.value, y.value) -> NumFromInt(-1)
               [] NumLess(y.value, x.value) -> OneNum
               [] x.value = NegZero /\ y.value = PosZero -> NumFromInt(-1)
               [] x.value = PosZero /\ y.value = NegZero -> OneNum
               [] OTHER -> PosZero)

\* The sort of SortIndexedProperties (§23.1.3.30.1): a stable merge sort by
\* CompareTypedArrayElements, which stops at the first abrupt comparison.
SortElements(s, values, comparator) ==
  IF Len(values) <= 1 THEN Ok(s, values)
  ELSE LET half == Len(values) \div 2
           left == SortElements(s, SubSeq(values, 1, half), comparator)
       IN IF IsAbrupt(left) THEN left ELSE
          LET right == SortElements(left.s, SubSeq(values, half + 1, Len(values)), comparator) IN
          IF IsAbrupt(right) THEN right ELSE MergeElements(right.s, Val(left), Val(right), comparator, <<>>)
MergeElements(s, left, right, comparator, acc) ==
  IF left = <<>> THEN Ok(s, acc \o right)
  ELSE IF right = <<>> THEN Ok(s, acc \o left)
  ELSE LET c == CompareTypedArrayElements(s, Head(left), Head(right), comparator) IN
       IF IsAbrupt(c) THEN c
       ELSE IF NumLess(PosZero, Val(c)) THEN MergeElements(c.s, left, Tail(right), comparator, Append(acc, Head(right)))
       ELSE MergeElements(c.s, Tail(left), right, comparator, Append(acc, Head(left)))

\* The %TypedArray%.prototype methods (§23.2.3) that start with ValidateTypedArray, on ta of
\* length len.
TypedArrayMethod(s, ta, len, m, args) ==
  LET a1 == Arg(args, 1)
      a2 == Arg(args, 2)
      a3 == Arg(args, 3)
  IN
  CASE m = "at" ->
         LET k == ToAbsoluteIndex(s, a1, len) IN IF IsAbrupt(k) THEN k
         ELSE Ok(k.s, IF NumLess(Val(k), PosZero) \/ ~NumLess(Val(k), NumFromInt(len)) THEN Undefined
                      ELSE TypedArrayGetElement(k.s, ta, Val(k)))
    [] m = "copyWithin" ->
         LET to == ToClampedIndex(s, a1, len) IN IF IsAbrupt(to) THEN to ELSE
         LET from == ToClampedIndex(to.s, a2, len) IN IF IsAbrupt(from) THEN from ELSE
         LET final == IF a3 = Undefined THEN Ok(from.s, len) ELSE ToClampedIndex(from.s, a3, len) IN
         IF IsAbrupt(final) THEN final
         ELSE IF IntegerMin(Val(final) - Val(from), len - Val(to)) <= 0 THEN Ok(final.s, ta)
         ELSE LET b == ValidateTypedArrayBounds(final.s, ta) IN IF IsAbrupt(b) THEN b ELSE
              LET count == IntegerMin(IntegerMin(Val(final) - Val(from), len - Val(to)),
                                      IntegerMin(Val(b) - Val(from), Val(b) - Val(to)))
                  size == TypedArraySize(b.s, ta)
                  slots == O(b.s, ta).slots
                  fromByte == Val(from) * size + slots.byteOffset
              IN Ok(IF count <= 0 THEN b.s
                    ELSE SetBufferBytes(b.s, slots.buffer, Val(to) * size + slots.byteOffset,
                                        BufferBytes(b.s, slots.buffer, fromByte, count * size)), ta)
    [] m = "entries" -> CreateArrayIterator(s, ta, "key+value")
    [] m = "keys" -> CreateArrayIterator(s, ta, "key")
    [] m = "values" -> CreateArrayIterator(s, ta, "value")
    [] m \in {"every", "some", "forEach", "map", "filter", "reduce", "reduceRight",
              "find", "findIndex", "findLast", "findLastIndex"} /\ ~IsCallable(s, a1) -> ThrowTypeError(s)
    [] m \in {"every", "some", "forEach", "find", "findIndex"} -> TypedArrayVisit(s, ta, len, 0, m, a1, a2)
    [] m \in {"findLast", "findLastIndex"} -> TypedArrayVisit(s, ta, len, len - 1, m, a1, a2)
    [] m = "fill" ->
         LET v == IF IsBigIntTypedArray(s, ta) THEN ToBigInt(s, a1) ELSE ToNumber(s, a1) IN IF IsAbrupt(v) THEN v ELSE
         LET first == ToClampedIndex(v.s, a2, len) IN IF IsAbrupt(first) THEN first ELSE
         LET final == IF a3 = Undefined THEN Ok(first.s, len) ELSE ToClampedIndex(first.s, a3, len) IN
         IF IsAbrupt(final) THEN final ELSE
         LET b == ValidateTypedArrayBounds(final.s, ta) IN IF IsAbrupt(b) THEN b
         ELSE Ok(StoreElements(b.s, ta, [i \in 1..IntegerMin(Val(final), Val(b)) |-> Val(v)], Val(first)), ta)
    [] m = "filter" ->
         LET kept == FilterFrom(s, ta, len, 0, a1, a2, <<>>) IN IF IsAbrupt(kept) THEN kept ELSE
         LET r == TypedArraySpeciesCreate(kept.s, ta, <<IntV(Len(Val(kept)))>>, TRUE) IN IF IsAbrupt(r) THEN r
         ELSE TypedArraySetElements(r.s, Val(r), Val(kept), Empty, 0, Len(Val(kept)), Undefined, Undefined)
    [] m = "includes" ->
         IF len = 0 THEN Ok(s, False)
         ELSE LET k == ToClampedIndex(s, a2, len) IN IF IsAbrupt(k) THEN k
         ELSE Ok(k.s, Bool(\E i \in Val(k)..(len - 1) : SameValueZero(a1, TypedArrayGetElement(k.s, ta, NumFromInt(i)))))
    [] m = "indexOf" ->
         IF len = 0 THEN Ok(s, IntV(-1))
         ELSE LET k == ToClampedIndex(s, a2, len) IN IF IsAbrupt(k) THEN k
         ELSE Ok(k.s, IntV(StrictIndexFrom(k.s, ta, a1, Val(k), len, 1)))
    [] m = "lastIndexOf" ->
         IF len = 0 THEN Ok(s, IntV(-1))
         ELSE LET k == IF Len(args) < 2 THEN Ok(s, NumFromInt(len - 1)) ELSE ToAbsoluteIndex(s, a2, len) IN
         IF IsAbrupt(k) THEN k
         ELSE IF NumLess(Val(k), PosZero) THEN Ok(k.s, IntV(-1))
         ELSE Ok(k.s, IntV(StrictIndexFrom(k.s, ta, a1, IF NumLess(Val(k), NumFromInt(len)) THEN NumToSmallInt(Val(k)) ELSE len - 1,
                                           len, -1)))
    [] m = "join" ->
         LET separator == IF a1 = Undefined THEN Ok(s, SV(",")) ELSE ToStr(s, a1) IN IF IsAbrupt(separator) THEN separator
         ELSE Ok(separator.s, Str(JoinElements(separator.s, ta, 0, len, Val(separator).value)))
    [] m = "map" ->
         LET r == TypedArraySpeciesCreate(s, ta, <<IntV(len)>>, TRUE) IN IF IsAbrupt(r) THEN r
         ELSE MapFromTypedArray(r.s, ta, Val(r), 0, len, a1, a2)
    [] m \in {"reduce", "reduceRight"} ->
         LET step == IF m = "reduce" THEN 1 ELSE -1
             start == IF m = "reduce" THEN 0 ELSE len - 1
         IN IF Len(args) >= 2 THEN ReduceFrom(s, ta, len, start, step, a1, a2)
            ELSE IF len = 0 THEN ThrowTypeError(s)
            ELSE ReduceFrom(s, ta, len, start + step, step, a1, TypedArrayGetElement(s, ta, NumFromInt(start)))
    [] m = "reverse" -> Ok(StoreElements(s, ta, [i \in 1..len |-> TypedArrayGetElement(s, ta, NumFromInt(len - i))], 0), ta)
    [] m = "slice" ->
         LET first == ToClampedIndex(s, a1, len) IN IF IsAbrupt(first) THEN first ELSE
         LET final == IF a2 = Undefined THEN Ok(first.s, len) ELSE ToClampedIndex(first.s, a2, len) IN
         IF IsAbrupt(final) THEN final ELSE
         LET count == IntegerMax(Val(final) - Val(first), 0)
             r == TypedArraySpeciesCreate(final.s, ta, <<IntV(count)>>, TRUE)
         IN IF IsAbrupt(r) \/ count = 0 THEN r ELSE
            LET b == ValidateTypedArrayBounds(r.s, ta) IN IF IsAbrupt(b) THEN b ELSE
            LET end == IntegerMin(Val(final), Val(b))
                size == TypedArraySize(b.s, ta)
                sourceSlots == O(b.s, ta).slots
                targetSlots == O(b.s, Val(r)).slots
            IN Ok(IF TypedArrayType(b.s, ta) = TypedArrayType(b.s, Val(r))
                  THEN CopyBytesUp(b.s, sourceSlots.buffer, Val(first) * size + sourceSlots.byteOffset,
                                   targetSlots.buffer, targetSlots.byteOffset, IntegerMax(end - Val(first), 0) * size)
                  ELSE StoreElements(b.s, Val(r), [i \in 1..IntegerMax(end - Val(first), 0) |->
                                                     TypedArrayGetElement(b.s, ta, NumFromInt(Val(first) + i - 1))], 0),
                  Val(r))
    [] m = "sort" ->
         LET sorted == SortElements(s, TypedArrayElements(s, ta, len), a1) IN IF IsAbrupt(sorted) THEN sorted
         ELSE Ok(StoreElements(sorted.s, ta, Val(sorted), 0), ta)
    [] m = "toSorted" ->
         LET r == TypedArrayCreateSameType(s, ta, len) IN IF IsAbrupt(r) THEN r ELSE
         LET sorted == SortElements(r.s, TypedArrayElements(r.s, ta, len), a1) IN IF IsAbrupt(sorted) THEN sorted
         ELSE Ok(StoreElements(sorted.s, Val(r), Val(sorted), 0), Val(r))
    [] m = "toLocaleString" -> LocaleJoin(s, ta, 0, len, <<>>)
    [] m = "toReversed" ->
         LET r == TypedArrayCreateSameType(s, ta, len) IN IF IsAbrupt(r) THEN r
         ELSE Ok(StoreElements(r.s, Val(r), [i \in 1..len |-> TypedArrayGetElement(r.s, ta, NumFromInt(len - i))], 0), Val(r))
    [] m = "with" ->
         LET index == ToAbsoluteIndex(s, a1, len) IN IF IsAbrupt(index) THEN index ELSE
         LET v == IF IsBigIntTypedArray(s, ta) THEN ToBigInt(index.s, a2) ELSE ToNumber(index.s, a2) IN
         IF IsAbrupt(v) THEN v
         ELSE IF ~IsValidIntegerIndex(v.s, ta, Val(index)) THEN ThrowError(v.s, "RangeError")
         ELSE LET r == TypedArrayCreateSameType(v.s, ta, len) IN IF IsAbrupt(r) THEN r
         ELSE TypedArraySetElements(r.s, Val(r), [i \in 1..len |-> IF i - 1 = NumToSmallInt(Val(index)) THEN Val(v)
                                                         ELSE TypedArrayGetElement(r.s, ta, NumFromInt(i - 1))],
                          Empty, 0, len, Undefined, Undefined)

TypedArrayIntrinsics ==
  << IntrinsicFunction("TypedArray", "FunctionPrototype", <<"TypedArray", "constructor">>, 0, N("TypedArray"), TRUE),
     IntrinsicObject("TypedArrayPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("TypedArrayProto_values", "FunctionPrototype", <<"TypedArray", "values">>, 0, N("values"), FALSE) >> \o
  [i \in DOMAIN TypedArrayNames |->
     IntrinsicFunction(TypedArrayNames[i], "TypedArray", <<"TypedArray", TypedArrayNames[i]>>, 3,
                       TypedArrayNameUnits(TypedArrayNames[i]), TRUE)] \o
  [i \in DOMAIN TypedArrayNames |->
     IntrinsicObject(TypedArrayNames[i] \o "Prototype", "TypedArrayPrototype", "ordinary", [none |-> TRUE])]

TypedArrayProperties ==
  Ctor("TypedArray", "TypedArrayPrototype") \o
  << M("TypedArray", SV("from"), "TypedArray", "from", 1),
     M("TypedArray", SV("of"), "TypedArray", "of", 0),
     G("TypedArray", SymSpecies, "TypedArray", "species", ""),
     G("TypedArrayPrototype", SV("buffer"), "TypedArray", "buffer", ""),
     G("TypedArrayPrototype", SV("byteLength"), "TypedArray", "byteLength", ""),
     G("TypedArrayPrototype", SV("byteOffset"), "TypedArray", "byteOffset", ""),
     G("TypedArrayPrototype", SV("length"), "TypedArray", "length", ""),
     G("TypedArrayPrototype", SymToStringTag, "TypedArray", "toStringTag", ""),
     M("TypedArrayPrototype", SV("at"), "TypedArray", "at", 1),
     M("TypedArrayPrototype", SV("copyWithin"), "TypedArray", "copyWithin", 2),
     M("TypedArrayPrototype", SV("entries"), "TypedArray", "entries", 0),
     M("TypedArrayPrototype", SV("every"), "TypedArray", "every", 1),
     M("TypedArrayPrototype", SV("fill"), "TypedArray", "fill", 1),
     M("TypedArrayPrototype", SV("filter"), "TypedArray", "filter", 1),
     M("TypedArrayPrototype", SV("find"), "TypedArray", "find", 1),
     M("TypedArrayPrototype", SV("findIndex"), "TypedArray", "findIndex", 1),
     M("TypedArrayPrototype", SV("findLast"), "TypedArray", "findLast", 1),
     M("TypedArrayPrototype", SV("findLastIndex"), "TypedArray", "findLastIndex", 1),
     M("TypedArrayPrototype", SV("forEach"), "TypedArray", "forEach", 1),
     M("TypedArrayPrototype", SV("includes"), "TypedArray", "includes", 1),
     M("TypedArrayPrototype", SV("indexOf"), "TypedArray", "indexOf", 1),
     M("TypedArrayPrototype", SV("join"), "TypedArray", "join", 1),
     M("TypedArrayPrototype", SV("keys"), "TypedArray", "keys", 0),
     M("TypedArrayPrototype", SV("lastIndexOf"), "TypedArray", "lastIndexOf", 1),
     M("TypedArrayPrototype", SV("map"), "TypedArray", "map", 1),
     M("TypedArrayPrototype", SV("reduce"), "TypedArray", "reduce", 1),
     M("TypedArrayPrototype", SV("reduceRight"), "TypedArray", "reduceRight", 1),
     M("TypedArrayPrototype", SV("reverse"), "TypedArray", "reverse", 0),
     M("TypedArrayPrototype", SV("set"), "TypedArray", "set", 1),
     M("TypedArrayPrototype", SV("slice"), "TypedArray", "slice", 2),
     M("TypedArrayPrototype", SV("some"), "TypedArray", "some", 1),
     M("TypedArrayPrototype", SV("sort"), "TypedArray", "sort", 1),
     M("TypedArrayPrototype", SV("subarray"), "TypedArray", "subarray", 2),
     M("TypedArrayPrototype", SV("toLocaleString"), "TypedArray", "toLocaleString", 0),
     M("TypedArrayPrototype", SV("toReversed"), "TypedArray", "toReversed", 0),
     M("TypedArrayPrototype", SV("toSorted"), "TypedArray", "toSorted", 1),
     M("TypedArrayPrototype", SV("with"), "TypedArray", "with", 2),
     L("TypedArrayPrototype", SV("toString"), "ArrayProto_toString", TRUE, FALSE, TRUE),
     L("TypedArrayPrototype", SV("values"), "TypedArrayProto_values", TRUE, FALSE, TRUE),
     L("TypedArrayPrototype", SymIterator, "TypedArrayProto_values", TRUE, FALSE, TRUE) >> \o
  FoldLeftSeq([i \in DOMAIN TypedArrayNames |->
                 LET name == TypedArrayNames[i]
                     size == IntV(ElementSize(TypedArrayElementType(name)))
                 IN Ctor(name, name \o "Prototype") \o
                    << V(name, SV("BYTES_PER_ELEMENT"), size, FALSE, FALSE, FALSE),
                       V(name \o "Prototype", SV("BYTES_PER_ELEMENT"), size, FALSE, FALSE, FALSE),
                       GlobalLink(name, TypedArrayNameUnits(name)) >>])

\* %TypedArray% (§23.2.1 to §23.2.3) and the TypedArray constructors (§23.2.5).
TypedArrayBuiltin(s, f, m, this, args, nt) ==
  LET a1 == Arg(args, 1)
      a2 == Arg(args, 2)
  IN
  CASE m = "constructor" -> ThrowTypeError(s)
    [] m \in Range(TypedArrayNames) -> TypedArrayConstruct(s, m, args, nt)
    [] m = "from" -> TypedArrayFrom(s, this, a1, a2, Arg(args, 3))
    \* %TypedArray%.of (§23.2.2.2).
    [] m = "of" ->
         IF ~IsConstructor(s, this) THEN ThrowTypeError(s)
         ELSE LET target == TypedArrayCreateFromConstructor(s, this, <<IntV(Len(args))>>, TRUE) IN
              IF IsAbrupt(target) THEN target
              ELSE TypedArraySetElements(target.s, Val(target), args, Empty, 0, Len(args), Undefined, Undefined)
    [] m = "species" -> Ok(s, this)
    [] m = "toStringTag" -> Ok(s, IF IsTypedArray(s, this) THEN Str(TypedArrayNameUnits(O(s, this).slots.name)) ELSE Undefined)
    [] m \in {"buffer", "byteLength", "byteOffset", "length"} ->
         IF ~IsTypedArray(s, this) THEN ThrowTypeError(s)
         ELSE Ok(s, CASE m = "buffer" -> O(s, this).slots.buffer
                      [] IsTypedArrayOutOfBounds(s, this) -> IntV(0)
                      [] m = "byteLength" -> IntV(TypedArrayByteLength(s, this))
                      [] m = "byteOffset" -> IntV(O(s, this).slots.byteOffset)
                      [] OTHER -> IntV(TypedArrayLength(s, this)))
    \* %TypedArray%.prototype.set (§23.2.3.26).
    [] m = "set" ->
         IF ~IsTypedArray(s, this) \/ IsImmutableBuffer(s, O(s, this).slots.buffer) THEN ThrowTypeError(s)
         ELSE LET offset == ToIntegerOrInfinity(s, a2) IN IF IsAbrupt(offset) THEN offset
         ELSE IF NumLess(Val(offset).value, PosZero) THEN ThrowError(offset.s, "RangeError")
         ELSE IF IsTypedArray(offset.s, a1) THEN SetTypedArrayFromTypedArray(offset.s, this, Val(offset).value, a1)
         ELSE SetTypedArrayFromArrayLike(offset.s, this, Val(offset).value, a1)
    [] m = "subarray" -> TypedArraySubarray(s, this, a1, a2)
    [] m \in {"sort", "toSorted"} /\ a1 # Undefined /\ ~IsCallable(s, a1) -> ThrowTypeError(s)
    [] OTHER ->
         LET len == IF m \in {"copyWithin", "fill", "reverse", "sort"} THEN ValidateTypedArrayForWrite(s, this)
                    ELSE ValidateTypedArray(s, this)
         IN IF IsAbrupt(len) THEN len ELSE TypedArrayMethod(len.s, this, Val(len), m, args)
