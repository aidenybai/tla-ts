\* ArrayBuffer (§25.1) and SharedArrayBuffer (§25.2) objects, and the byte encoding of numbers. A
\* buffer has class "arrayBuffer" and slots:
\*   data      its Data Block (see BlockOf), empty when detached
\*   detached  whether its [[ArrayBufferData]] is null
\*   immutable whether it has [[ArrayBufferIsImmutable]] (proposal-immutable-arraybuffer)
\*   max       its [[ArrayBufferMaxByteLength]], or Empty when it is fixed-length
\*   shared    whether it is a SharedArrayBuffer
\* Its byte length is the length of its block. No host gives a buffer a detach key, so
\* [[ArrayBufferDetachKey]] is always empty and isn't kept. With a single agent no other buffer can
\* hold a SharedArrayBuffer's block, so two buffers share a block exactly when they are the same
\* buffer, and a growable one's block grows with its byte length.

\* The agent's [[LittleEndian]].
LittleEndian == TRUE

\* The largest Data Block this implementation creates. CreateByteDataBlock throws a RangeError
\* for a larger one.
MaxByteLength == 67108864
FitsDataBlock(n) == ~NumLess(NumFromInt(MaxByteLength), n)

IntegerMin(x, y) == IF x < y THEN x ELSE y

\* TypedArray element types (Table 71).
ElementSize(type) ==
  CASE type \in {"int8", "uint8", "uint8clamped"} -> 1
    [] type \in {"int16", "uint16", "float16"} -> 2
    [] type \in {"int32", "uint32", "float32"} -> 4
    [] OTHER -> 8
IsBigIntElementType(type) == type \in {"bigint64", "biguint64"}
IsUnclampedIntegerElementType(type) == type \in {"int8", "uint8", "int16", "uint16", "int32", "uint32"}

\* The IEEE 754-2019 binary formats: the significand's precision and the exponent's width.
FloatFormat(type) ==
  CASE type = "float16" -> [precision |-> 11, exponentBits |-> 5]
    [] type = "float32" -> [precision |-> 24, exponentBits |-> 8]
    [] type = "float64" -> [precision |-> 53, exponentBits |-> 11]

\* The bits of the Number x in format f, as a BigNat, rounding ties to even. NaN is the quiet NaN
\* with a clear sign.
FloatBits(x, f) ==
  LET bias == 2 ^ (f.exponentBits - 1) - 1
      fractionBits == f.precision - 1
      exponentOnes == BNShiftLeft(BNFromInt(2 ^ f.exponentBits - 1), fractionBits)
      r == IF x.k \in {"nan", "inf"} \/ NumIsZero(x) THEN x
           ELSE RoundBits(x.neg, NumMag(x), NumExponent(x), FALSE, f.precision, 1 - bias, bias)
      m == NumMag(r)
      top == NumExponent(r) + BNBitLength(m) - 1
      magnitude ==
        CASE r.k = "nan" -> BNAdd(exponentOnes, BNPow2(fractionBits - 1))
          [] r.k = "inf" -> exponentOnes
          [] NumIsZero(r) -> <<>>
          [] top >= 1 - bias ->
               BNAdd(BNShiftLeft(BNFromInt(top + bias), fractionBits),
                     BNSub(BNShift(m, f.precision - BNBitLength(m)), BNPow2(fractionBits)))
          [] OTHER -> BNShift(m, NumExponent(r) - (1 - bias) + fractionBits)
  IN IF r.neg /\ r.k # "nan" THEN BNAdd(magnitude, BNPow2(f.exponentBits + fractionBits)) ELSE magnitude

\* m * 2^k for a k that leaves it an integer.
BNShift(m, k) == IF k >= 0 THEN BNShiftLeft(m, k) ELSE BNShiftRight(m, -k)

\* The Number that the bits encode in format f.
FloatFromBits(bits, f) ==
  LET bias == 2 ^ (f.exponentBits - 1) - 1
      fractionBits == f.precision - 1
      neg == BNTestBit(bits, f.exponentBits + fractionBits)
      biased == BNToInt(BNLowBits(BNShiftRight(bits, fractionBits), f.exponentBits))
      fraction == BNLowBits(bits, fractionBits)
  IN CASE biased = 2 ^ f.exponentBits - 1 -> IF fraction = <<>> THEN MkNum("inf", neg, 0, <<>>, 0) ELSE NaN
       [] biased = 0 -> NumMakeNum(neg, fraction, 1 - bias - fractionBits)
       [] OTHER -> NumMakeNum(neg, BNAdd(fraction, BNPow2(fractionBits)), biased - bias - fractionBits)

\* The n bytes of a BigNat, least significant first, and the BigNat of little-endian bytes.
BigNatBytes(bits, n) == [i \in 1..n |-> BNToInt(BNLowBits(BNShiftRight(bits, 8 * (i - 1)), 8))]
BytesBigNat(bytes) ==
  IF bytes = <<>> THEN <<>> ELSE BNAdd(BNFromInt(Head(bytes)), BNShiftLeft(BytesBigNat(Tail(bytes)), 8))

\* A BigInt modulo 2^64, as the BigNat of its two's complement bits, and the BigInt that 64
\* two's complement bits encode.
BigInt64Bits(b) ==
  LET low == BNLowBits(b.mag, 64) IN IF b.neg /\ low # <<>> THEN BNSub(BNPow2(64), low) ELSE low
BigIntFromBits64(bits) ==
  IF BNTestBit(bits, 63) THEN BigIntOf(TRUE, BNSub(BNPow2(64), bits)) ELSE BigIntOf(FALSE, bits)

\* NumericToRawBytes (§25.1.3.17).
NumericToRawBytes(type, v, isLittleEndian) ==
  LET bytes ==
        CASE type \in {"float16", "float32", "float64"} ->
               BigNatBytes(FloatBits(v.value, FloatFormat(type)), ElementSize(type))
          [] type = "uint8clamped" -> <<NumToUint8Clamp(v.value)>>
          [] type \in {"int8", "uint8"} -> <<NumToUint8(v.value)>>
          [] type \in {"int16", "uint16"} -> LET low == NumToUint16(v.value) IN <<low % 256, low \div 256>>
          [] type \in {"int32", "uint32"} ->
               LET halves == Uint32Halves(v.value)
               IN <<halves[2] % 256, halves[2] \div 256, halves[1] % 256, halves[1] \div 256>>
          [] OTHER -> BigNatBytes(BigInt64Bits(v.value), 8)
  IN IF isLittleEndian THEN bytes ELSE Reverse(bytes)

\* RawBytesToNumeric (§25.1.3.14).
RawBytesToNumeric(type, raw, isLittleEndian) ==
  LET bytes == IF isLittleEndian THEN raw ELSE Reverse(raw)
      halves == IF Len(bytes) = 4 THEN <<bytes[3] + 256 * bytes[4], bytes[1] + 256 * bytes[2]>> ELSE <<>>
  IN CASE type \in {"float16", "float32", "float64"} -> Num(FloatFromBits(BytesBigNat(bytes), FloatFormat(type)))
       [] type \in {"uint8", "uint8clamped"} -> IntV(bytes[1])
       [] type = "int8" -> IntV(IF bytes[1] >= 128 THEN bytes[1] - 256 ELSE bytes[1])
       [] type = "uint16" -> IntV(bytes[1] + 256 * bytes[2])
       [] type = "int16" -> LET u == bytes[1] + 256 * bytes[2] IN IntV(IF u >= 32768 THEN u - 65536 ELSE u)
       [] type = "uint32" -> Num(Uint32FromHalves(halves))
       [] type = "int32" -> IntV(Int32FromHalves(halves))
       [] type = "biguint64" -> BigInt(BigIntOf(FALSE, BytesBigNat(bytes)))
       [] type = "bigint64" -> BigInt(BigIntFromBits64(BytesBigNat(bytes)))

\* Buffers and their Data Blocks.
IsBuffer(s, v, shared) == IsObject(v) /\ O(s, v).class = "arrayBuffer" /\ O(s, v).slots.shared = shared
IsDetachedBuffer(s, b) == O(s, b).slots.detached
IsSharedArrayBuffer(s, b) == O(s, b).slots.shared
IsFixedLengthArrayBuffer(s, b) == O(s, b).slots.max = Empty
IsImmutableBuffer(s, b) == O(s, b).slots.immutable

\* A Data Block of byte values, in pages of BlockPageSize bytes, so that storing a few bytes copies
\* their page and the list of pages rather than the whole block.
BlockPageSize == 256
BlockOf(bytes) ==
  [size |-> Len(bytes),
   pages |-> [k \in 1..((Len(bytes) + BlockPageSize - 1) \div BlockPageSize) |->
                SubSeq(bytes, (k - 1) * BlockPageSize + 1, IntegerMin(k * BlockPageSize, Len(bytes)))]]
BlockByte(block, byteIndex) == block.pages[byteIndex \div BlockPageSize + 1][(byteIndex % BlockPageSize) + 1]
\* The count bytes of a block from byteIndex.
BlockBytes(block, byteIndex, count) == [i \in 1..count |-> BlockByte(block, byteIndex + i - 1)]
\* A block with bytes stored from byteIndex, one page entry at a time for a few bytes.
BlockStore(block, byteIndex, bytes) ==
  IF Len(bytes) > BlockPageSize
  THEN BlockOf([i \in 1..block.size |->
                  IF i > byteIndex /\ i <= byteIndex + Len(bytes) THEN bytes[i - byteIndex] ELSE BlockByte(block, i - 1)])
  ELSE BlockStoreFrom(block, byteIndex, bytes)
BlockStoreFrom(block, byteIndex, bytes) ==
  IF bytes = <<>> THEN block
  ELSE BlockStoreFrom([block EXCEPT !.pages[byteIndex \div BlockPageSize + 1][(byteIndex % BlockPageSize) + 1] = Head(bytes)],
                      byteIndex + 1, Tail(bytes))

ArrayBufferByteLength(s, b) == O(s, b).slots.data.size
SetBufferData(s, b, bytes) == SetO(s, b, [O(s, b) EXCEPT !.slots.data = BlockOf(bytes)])
\* The count bytes of b's block from byteIndex.
BufferBytes(s, b, byteIndex, count) == BlockBytes(O(s, b).slots.data, byteIndex, count)
\* Stores bytes into b's block from byteIndex.
SetBufferBytes(s, b, byteIndex, bytes) == SetO(s, b, [O(s, b) EXCEPT !.slots.data = BlockStore(@, byteIndex, bytes)])

\* GetValueFromBuffer (§25.1.3.16) and SetValueInBuffer (§25.1.3.18). One agent sees every write
\* to a shared block at once, so a shared block reads and writes as any other.
GetValueFromBuffer(s, b, byteIndex, type, isLittleEndian) ==
  RawBytesToNumeric(type, BufferBytes(s, b, byteIndex, ElementSize(type)), isLittleEndian)
SetValueInBuffer(s, b, byteIndex, type, v, isLittleEndian) ==
  SetBufferBytes(s, b, byteIndex, NumericToRawBytes(type, v, isLittleEndian))

\* AllocateArrayBuffer (§25.1.3.1) and AllocateSharedArrayBuffer (§25.2.2.1), with byteLength a
\* Number and maxByteLength a Number or Empty.
AllocateBuffer(s, ctor, byteLength, maxByteLength, shared) ==
  IF maxByteLength # Empty /\ NumLess(maxByteLength, byteLength) THEN ThrowError(s, "RangeError")
  ELSE LET p == GetPrototypeFromConstructor(s, ctor, IF shared THEN "SharedArrayBufferPrototype" ELSE "ArrayBufferPrototype") IN
  IF IsAbrupt(p) THEN p
  ELSE IF ~FitsDataBlock(byteLength) \/ (maxByteLength # Empty /\ ~FitsDataBlock(maxByteLength))
  THEN ThrowError(p.s, "RangeError")
  ELSE LET a == Alloc(p.s, MakeObject(Val(p), "arrayBuffer",
                        [data |-> BlockOf(Repeat(0, NumToSmallInt(byteLength))), detached |-> FALSE, immutable |-> FALSE, shared |-> shared,
                         max |-> IF maxByteLength = Empty THEN Empty ELSE NumToSmallInt(maxByteLength)]))
       IN Ok(a.s, a.v)

\* AllocateImmutableArrayBuffer, for a Number byteLength and the bytes to copy into its start.
AllocateImmutableArrayBuffer(s, byteLength, bytes) ==
  LET a == AllocateBuffer(s, Intrinsic(s, "ArrayBuffer"), byteLength, Empty, FALSE) IN
  IF IsAbrupt(a) THEN a
  ELSE Ok(SetO(a.s, Val(a), [O(a.s, Val(a)) EXCEPT !.slots.immutable = TRUE, !.slots.data = BlockStore(@, 0, bytes)]),
          Val(a))

CloneArrayBuffer(s, b, byteOffset, length) ==
  LET a == AllocateBuffer(s, Intrinsic(s, "ArrayBuffer"), NumFromInt(length), Empty, FALSE) IN
  IF IsAbrupt(a) THEN a
  ELSE Ok(SetBufferData(a.s, Val(a), BufferBytes(a.s, b, byteOffset, length)), Val(a))

\* DetachArrayBuffer (§25.1.3.5) without a key.
DetachArrayBuffer(s, b) == SetO(s, b, [O(s, b) EXCEPT !.slots.data = BlockOf(<<>>), !.slots.detached = TRUE])

\* GetArrayBufferMaxByteLengthOption (§25.1.3.7): a Number or Empty.
GetArrayBufferMaxByteLengthOption(s, options) ==
  IF ~IsObject(options) THEN Ok(s, Empty)
  ELSE LET m == Get(s, options, SV("maxByteLength")) IN
  IF IsAbrupt(m) THEN m
  ELSE IF Val(m) = Undefined THEN Ok(m.s, Empty)
  ELSE LET i == ToIndex(m.s, Val(m)) IN IF IsAbrupt(i) THEN i ELSE Ok(i.s, Val(i).value)

\* ArrayBuffer ( length [ , options ] ) (§25.1.4.1) and SharedArrayBuffer (§25.2.3.1).
BufferConstructor(s, args, nt, shared) ==
  IF nt = Undefined THEN ThrowTypeError(s)
  ELSE LET length == ToIndex(s, Arg(args, 1)) IN IF IsAbrupt(length) THEN length ELSE
  LET max == GetArrayBufferMaxByteLengthOption(length.s, Arg(args, 2)) IN IF IsAbrupt(max) THEN max
  ELSE AllocateBuffer(max.s, nt, Val(length).value, Val(max), shared)

\* ArrayBufferCopyAndDetach (§25.1.3.3) on an ArrayBuffer, for preserveResizability
\* "preserve-resizability", "fixed-length", or "immutable".
ArrayBufferCopyAndDetach(s, b, newLength, preserveResizability) ==
  LET n == IF newLength = Undefined THEN Ok(s, IntV(ArrayBufferByteLength(s, b))) ELSE ToIndex(s, newLength) IN
  IF IsAbrupt(n) THEN n
  ELSE IF IsDetachedBuffer(n.s, b) \/ IsImmutableBuffer(n.s, b) THEN ThrowTypeError(n.s)
  ELSE LET max == IF preserveResizability = "preserve-resizability" /\ ~IsFixedLengthArrayBuffer(n.s, b)
                  THEN NumFromInt(O(n.s, b).slots.max) ELSE Empty
           new == AllocateBuffer(n.s, Intrinsic(n.s, "ArrayBuffer"), Val(n).value, max, FALSE)
       IN IF IsAbrupt(new) THEN new
          ELSE LET copied == BufferBytes(new.s, b, 0, IntegerMin(ArrayBufferByteLength(new.s, Val(new)),
                                                                  ArrayBufferByteLength(new.s, b)))
                   filled == SetBufferBytes(new.s, Val(new), 0, copied)
               IN Ok(DetachArrayBuffer(IF preserveResizability = "immutable"
                                       THEN SetO(filled, Val(new), [O(filled, Val(new)) EXCEPT !.slots.immutable = TRUE])
                                       ELSE filled, b),
                     Val(new))

\* ArrayBuffer.prototype.slice (§25.1.6.7) and SharedArrayBuffer.prototype.slice (§25.2.5.6).
BufferSlice(s, b, start, end, shared) ==
  IF ~shared /\ IsDetachedBuffer(s, b) THEN ThrowTypeError(s)
  ELSE LET len == ArrayBufferByteLength(s, b)
           first == ToClampedIndex(s, start, len)
       IN IF IsAbrupt(first) THEN first ELSE
          LET final == IF end = Undefined THEN Ok(first.s, len) ELSE ToClampedIndex(first.s, end, len) IN
          IF IsAbrupt(final) THEN final ELSE
          LET newLength == IntegerMax(Val(final) - Val(first), 0)
              ctor == SpeciesConstructor(final.s, b, Intrinsic(final.s, IF shared THEN "SharedArrayBuffer" ELSE "ArrayBuffer"))
          IN IF IsAbrupt(ctor) THEN ctor ELSE
             LET new == Construct(ctor.s, Val(ctor), <<IntV(newLength)>>, Val(ctor)) IN
             IF IsAbrupt(new) THEN new
             ELSE LET t == new.s
                      nb == Val(new)
                  IN IF ~IsBuffer(t, nb, shared) \/ (~shared /\ (IsDetachedBuffer(t, nb) \/ IsImmutableBuffer(t, nb))) \/
                        SameValue(nb, b) \/
                        ArrayBufferByteLength(t, nb) < newLength \/ (~shared /\ IsDetachedBuffer(t, b))
                     THEN ThrowTypeError(t)
                     ELSE LET count == IntegerMin(newLength, ArrayBufferByteLength(t, b) - Val(first))
                          IN Ok(IF count > 0
                                THEN SetBufferBytes(t, nb, 0, BufferBytes(t, b, Val(first), count))
                                ELSE t, nb)

ArrayBufferIntrinsics ==
  << IntrinsicFunction("ArrayBuffer", "FunctionPrototype", <<"ArrayBuffer", "constructor">>, 1, N("ArrayBuffer"), TRUE),
     IntrinsicObject("ArrayBufferPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]) >>

ArrayBufferProperties ==
  Ctor("ArrayBuffer", "ArrayBufferPrototype") \o
  << M("ArrayBuffer", SV("isView"), "ArrayBuffer", "isView", 1),
     G("ArrayBuffer", SymSpecies, "ArrayBuffer", "species", ""),
     G("ArrayBufferPrototype", SV("byteLength"), "ArrayBuffer", "byteLength", ""),
     G("ArrayBufferPrototype", SV("detached"), "ArrayBuffer", "detached", ""),
     G("ArrayBufferPrototype", SV("immutable"), "ArrayBuffer", "immutable", ""),
     G("ArrayBufferPrototype", SV("maxByteLength"), "ArrayBuffer", "maxByteLength", ""),
     G("ArrayBufferPrototype", SV("resizable"), "ArrayBuffer", "resizable", ""),
     M("ArrayBufferPrototype", SV("resize"), "ArrayBuffer", "resize", 1),
     M("ArrayBufferPrototype", SV("slice"), "ArrayBuffer", "slice", 2),
     M("ArrayBufferPrototype", SV("sliceToImmutable"), "ArrayBuffer", "sliceToImmutable", 2),
     M("ArrayBufferPrototype", SV("transfer"), "ArrayBuffer", "transfer", 0),
     M("ArrayBufferPrototype", SV("transferToFixedLength"), "ArrayBuffer", "transferToFixedLength", 0),
     M("ArrayBufferPrototype", SV("transferToImmutable"), "ArrayBuffer", "transferToImmutable", 0),
     V("ArrayBufferPrototype", SymToStringTag, SV("ArrayBuffer"), FALSE, FALSE, TRUE),
     GlobalLink("ArrayBuffer", N("ArrayBuffer")),
     M("Host262", SV("detachArrayBuffer"), "ArrayBuffer", "detach", 1) >>

\* ArrayBuffer (§25.1.4 to §25.1.6) and the test262 host's $262.detachArrayBuffer.
ArrayBufferBuiltin(s, f, m, this, args, nt) ==
  LET a1 == Arg(args, 1) IN
  CASE m = "constructor" -> BufferConstructor(s, args, nt, FALSE)
    [] m = "isView" -> Ok(s, Bool(IsObject(a1) /\ O(s, a1).class \in {"typedArray", "dataView"}))
    [] m = "species" -> Ok(s, this)
    [] m = "detach" ->
         IF IsBuffer(s, a1, FALSE) /\ ~IsImmutableBuffer(s, a1) THEN Ok(DetachArrayBuffer(s, a1), Undefined) ELSE ThrowTypeError(s)
    [] ~IsBuffer(s, this, FALSE) \/ (m = "resize" /\ IsFixedLengthArrayBuffer(s, this)) -> ThrowTypeError(s)
    [] m = "byteLength" -> Ok(s, IntV(ArrayBufferByteLength(s, this)))
    [] m = "detached" -> Ok(s, Bool(IsDetachedBuffer(s, this)))
    [] m = "immutable" -> Ok(s, Bool(IsImmutableBuffer(s, this)))
    [] m = "maxByteLength" ->
         Ok(s, IntV(IF IsDetachedBuffer(s, this) THEN 0
                    ELSE IF IsFixedLengthArrayBuffer(s, this) THEN ArrayBufferByteLength(s, this)
                    ELSE O(s, this).slots.max))
    [] m = "resizable" -> Ok(s, Bool(~IsFixedLengthArrayBuffer(s, this)))
    \* ArrayBuffer.prototype.resize (§25.1.6.6).
    [] m = "resize" ->
         LET n == ToIndex(s, a1) IN IF IsAbrupt(n) THEN n
         ELSE IF IsDetachedBuffer(n.s, this) THEN ThrowTypeError(n.s)
         ELSE IF NumLess(NumFromInt(O(n.s, this).slots.max), Val(n).value) THEN ThrowError(n.s, "RangeError")
         ELSE LET newLength == NumToSmallInt(Val(n).value)
                  current == ArrayBufferByteLength(n.s, this)
              IN Ok(SetBufferData(n.s, this, IF newLength <= current THEN BufferBytes(n.s, this, 0, newLength)
                                            ELSE BufferBytes(n.s, this, 0, current) \o Repeat(0, newLength - current)),
                    Undefined)
    [] m = "slice" -> BufferSlice(s, this, a1, Arg(args, 2), FALSE)
    \* ArrayBuffer.prototype.sliceToImmutable (proposal-immutable-arraybuffer).
    [] m = "sliceToImmutable" ->
         IF IsDetachedBuffer(s, this) THEN ThrowTypeError(s) ELSE
         LET len == ArrayBufferByteLength(s, this)
             first == ToClampedIndex(s, a1, len)
         IN IF IsAbrupt(first) THEN first ELSE
         LET final == IF Arg(args, 2) = Undefined THEN Ok(first.s, len) ELSE ToClampedIndex(first.s, Arg(args, 2), len) IN
         IF IsAbrupt(final) THEN final
         ELSE IF IsDetachedBuffer(final.s, this) THEN ThrowTypeError(final.s)
         ELSE IF ArrayBufferByteLength(final.s, this) < Val(final) THEN ThrowError(final.s, "RangeError")
         ELSE LET newLength == IntegerMax(Val(final) - Val(first), 0) IN
              AllocateImmutableArrayBuffer(final.s, NumFromInt(newLength),
                                           BufferBytes(final.s, this, Val(first), newLength))
    [] m = "transfer" -> ArrayBufferCopyAndDetach(s, this, a1, "preserve-resizability")
    [] m = "transferToFixedLength" -> ArrayBufferCopyAndDetach(s, this, a1, "fixed-length")
    [] m = "transferToImmutable" -> ArrayBufferCopyAndDetach(s, this, a1, "immutable")

SharedArrayBufferIntrinsics ==
  << IntrinsicFunction("SharedArrayBuffer", "FunctionPrototype", <<"SharedArrayBuffer", "constructor">>, 1,
                       N("SharedArrayBuffer"), TRUE),
     IntrinsicObject("SharedArrayBufferPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]) >>

SharedArrayBufferProperties ==
  Ctor("SharedArrayBuffer", "SharedArrayBufferPrototype") \o
  << G("SharedArrayBuffer", SymSpecies, "SharedArrayBuffer", "species", ""),
     G("SharedArrayBufferPrototype", SV("byteLength"), "SharedArrayBuffer", "byteLength", ""),
     G("SharedArrayBufferPrototype", SV("growable"), "SharedArrayBuffer", "growable", ""),
     G("SharedArrayBufferPrototype", SV("maxByteLength"), "SharedArrayBuffer", "maxByteLength", ""),
     M("SharedArrayBufferPrototype", SV("grow"), "SharedArrayBuffer", "grow", 1),
     M("SharedArrayBufferPrototype", SV("slice"), "SharedArrayBuffer", "slice", 2),
     V("SharedArrayBufferPrototype", SymToStringTag, SV("SharedArrayBuffer"), FALSE, FALSE, TRUE),
     GlobalLink("SharedArrayBuffer", N("SharedArrayBuffer")) >>

\* SharedArrayBuffer (§25.2.3 to §25.2.5).
SharedArrayBufferBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" -> BufferConstructor(s, args, nt, TRUE)
    [] m = "species" -> Ok(s, this)
    [] m = "grow" /\ ~(IsObject(this) /\ O(s, this).class = "arrayBuffer" /\ O(s, this).slots.max # Empty) -> ThrowTypeError(s)
    [] ~IsBuffer(s, this, TRUE) -> ThrowTypeError(s)
    [] m = "byteLength" -> Ok(s, IntV(ArrayBufferByteLength(s, this)))
    [] m = "growable" -> Ok(s, Bool(~IsFixedLengthArrayBuffer(s, this)))
    [] m = "maxByteLength" ->
         Ok(s, IntV(IF IsFixedLengthArrayBuffer(s, this) THEN ArrayBufferByteLength(s, this) ELSE O(s, this).slots.max))
    \* SharedArrayBuffer.prototype.grow (§25.2.5.3).
    [] m = "grow" ->
         LET n == ToIndex(s, Arg(args, 1)) IN IF IsAbrupt(n) THEN n ELSE
         LET current == ArrayBufferByteLength(n.s, this) IN
         IF NumSameValueZero(Val(n).value, NumFromInt(current)) THEN Ok(n.s, Undefined)
         ELSE IF NumLess(Val(n).value, NumFromInt(current)) \/ NumLess(NumFromInt(O(n.s, this).slots.max), Val(n).value)
         THEN ThrowError(n.s, "RangeError")
         ELSE Ok(SetBufferData(n.s, this, BufferBytes(n.s, this, 0, current) \o Repeat(0, NumToSmallInt(Val(n).value) - current)), Undefined)
    [] m = "slice" -> BufferSlice(s, this, Arg(args, 1), Arg(args, 2), TRUE)
