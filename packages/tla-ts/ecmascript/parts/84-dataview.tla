\* DataView objects (§25.3). A DataView has class "dataView" and slots:
\*   buffer      [[ViewedArrayBuffer]]
\*   byteLength  [[ByteLength]], or Empty for ~auto~
\*   byteOffset  [[ByteOffset]]
\* As for TypedArrays, the DataView With Buffer Witness Records aren't kept.

IsDataView(s, v) == IsObject(v) /\ O(s, v).class = "dataView"

\* IsViewOutOfBounds (§25.3.1.4) and GetViewByteLength (§25.3.1.3).
IsViewOutOfBounds(s, view) ==
  LET o == O(s, view).slots IN
  IF IsDetachedBuffer(s, o.buffer) THEN TRUE
  ELSE LET bufferByteLength == ArrayBufferByteLength(s, o.buffer)
           end == IF o.byteLength = Empty THEN bufferByteLength ELSE o.byteOffset + o.byteLength
       IN o.byteOffset > bufferByteLength \/ end > bufferByteLength
GetViewByteLength(s, view) ==
  LET o == O(s, view).slots IN
  IF o.byteLength # Empty THEN o.byteLength ELSE ArrayBufferByteLength(s, o.buffer) - o.byteOffset

\* The element type of a get or set method, such as "int8" for getInt8.
DataViewType(m) ==
  CASE m \in {"getInt8", "setInt8"} -> "int8" [] m \in {"getUint8", "setUint8"} -> "uint8"
    [] m \in {"getInt16", "setInt16"} -> "int16" [] m \in {"getUint16", "setUint16"} -> "uint16"
    [] m \in {"getInt32", "setInt32"} -> "int32" [] m \in {"getUint32", "setUint32"} -> "uint32"
    [] m \in {"getBigInt64", "setBigInt64"} -> "bigint64" [] m \in {"getBigUint64", "setBigUint64"} -> "biguint64"
    [] m \in {"getFloat16", "setFloat16"} -> "float16" [] m \in {"getFloat32", "setFloat32"} -> "float32"
    [] m \in {"getFloat64", "setFloat64"} -> "float64"
DataViewGetters ==
  {"getInt8", "getUint8", "getInt16", "getUint16", "getInt32", "getUint32", "getBigInt64", "getBigUint64",
   "getFloat16", "getFloat32", "getFloat64"}

\* The checks GetViewValue (§25.3.1.5) and SetViewValue (§25.3.1.6) make after their conversions:
\* the view's byte index of getIndex, a Number.
ViewIndex(s, view, getIndex, type) ==
  IF IsViewOutOfBounds(s, view) THEN ThrowTypeError(s)
  ELSE IF NumLess(NumFromInt(GetViewByteLength(s, view)), NumAdd(getIndex, NumFromInt(ElementSize(type))))
  THEN ThrowError(s, "RangeError")
  ELSE Ok(s, NumToSmallInt(getIndex) + O(s, view).slots.byteOffset)

GetViewValue(s, view, requestIndex, isLittleEndian, type) ==
  LET getIndex == ToIndex(s, requestIndex) IN IF IsAbrupt(getIndex) THEN getIndex ELSE
  LET i == ViewIndex(getIndex.s, view, Val(getIndex).value, type) IN IF IsAbrupt(i) THEN i
  ELSE Ok(i.s, GetValueFromBuffer(i.s, O(i.s, view).slots.buffer, Val(i), type, ToBooleanValue(isLittleEndian)))

SetViewValue(s, view, requestIndex, isLittleEndian, type, value) ==
  IF IsImmutableBuffer(s, O(s, view).slots.buffer) THEN ThrowTypeError(s) ELSE
  LET getIndex == ToIndex(s, requestIndex) IN IF IsAbrupt(getIndex) THEN getIndex ELSE
  LET n == IF IsBigIntElementType(type) THEN ToBigInt(getIndex.s, value) ELSE ToNumber(getIndex.s, value) IN
  IF IsAbrupt(n) THEN n ELSE
  LET i == ViewIndex(n.s, view, Val(getIndex).value, type) IN IF IsAbrupt(i) THEN i
  ELSE Ok(SetValueInBuffer(i.s, O(i.s, view).slots.buffer, Val(i), type, Val(n), ToBooleanValue(isLittleEndian)), Undefined)

\* DataView ( buffer [ , byteOffset [ , byteLength ] ] ) (§25.3.2.1).
DataViewConstruct(s, buffer, byteOffset, byteLength, nt) ==
  IF nt = Undefined THEN ThrowTypeError(s)
  ELSE IF ~(IsObject(buffer) /\ O(s, buffer).class = "arrayBuffer") THEN ThrowTypeError(s)
  ELSE LET off == ToIndex(s, byteOffset) IN IF IsAbrupt(off) THEN off
  ELSE IF IsDetachedBuffer(off.s, buffer) THEN ThrowTypeError(off.s)
  ELSE IF NumLess(NumFromInt(ArrayBufferByteLength(off.s, buffer)), Val(off).value) THEN ThrowError(off.s, "RangeError")
  ELSE LET offset == NumToSmallInt(Val(off).value)
           bufferByteLength == ArrayBufferByteLength(off.s, buffer)
           viewByteLength ==
             IF byteLength # Undefined THEN ToIndex(off.s, byteLength)
             ELSE Ok(off.s, IF IsFixedLengthArrayBuffer(off.s, buffer) THEN IntV(bufferByteLength - offset) ELSE Empty)
       IN IF IsAbrupt(viewByteLength) THEN viewByteLength
          ELSE IF byteLength # Undefined /\ NumLess(NumFromInt(bufferByteLength - offset), Val(viewByteLength).value)
          THEN ThrowError(viewByteLength.s, "RangeError")
          ELSE LET o == OrdinaryCreateFromConstructor(viewByteLength.s, nt, "DataViewPrototype", "dataView",
                          [buffer |-> buffer, byteOffset |-> offset,
                           byteLength |-> IF Val(viewByteLength) = Empty THEN Empty ELSE NumToSmallInt(Val(viewByteLength).value)])
               IN IF IsAbrupt(o) THEN o
                  ELSE IF IsDetachedBuffer(o.s, buffer) THEN ThrowTypeError(o.s)
                  ELSE IF offset > ArrayBufferByteLength(o.s, buffer) \/
                          (byteLength # Undefined /\ offset + O(o.s, Val(o)).slots.byteLength > ArrayBufferByteLength(o.s, buffer))
                  THEN ThrowError(o.s, "RangeError")
                  ELSE o

DataViewIntrinsics ==
  << IntrinsicFunction("DataView", "FunctionPrototype", <<"DataView", "constructor">>, 1, N("DataView"), TRUE),
     IntrinsicObject("DataViewPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]) >>

DataViewProperties ==
  Ctor("DataView", "DataViewPrototype") \o
  << G("DataViewPrototype", SV("buffer"), "DataView", "buffer", ""),
     G("DataViewPrototype", SV("byteLength"), "DataView", "byteLength", ""),
     G("DataViewPrototype", SV("byteOffset"), "DataView", "byteOffset", ""),
     M("DataViewPrototype", SV("getBigInt64"), "DataView", "getBigInt64", 1),
     M("DataViewPrototype", SV("getBigUint64"), "DataView", "getBigUint64", 1),
     M("DataViewPrototype", SV("getFloat16"), "DataView", "getFloat16", 1),
     M("DataViewPrototype", SV("getFloat32"), "DataView", "getFloat32", 1),
     M("DataViewPrototype", SV("getFloat64"), "DataView", "getFloat64", 1),
     M("DataViewPrototype", SV("getInt8"), "DataView", "getInt8", 1),
     M("DataViewPrototype", SV("getInt16"), "DataView", "getInt16", 1),
     M("DataViewPrototype", SV("getInt32"), "DataView", "getInt32", 1),
     M("DataViewPrototype", SV("getUint8"), "DataView", "getUint8", 1),
     M("DataViewPrototype", SV("getUint16"), "DataView", "getUint16", 1),
     M("DataViewPrototype", SV("getUint32"), "DataView", "getUint32", 1),
     M("DataViewPrototype", SV("setBigInt64"), "DataView", "setBigInt64", 2),
     M("DataViewPrototype", SV("setBigUint64"), "DataView", "setBigUint64", 2),
     M("DataViewPrototype", SV("setFloat16"), "DataView", "setFloat16", 2),
     M("DataViewPrototype", SV("setFloat32"), "DataView", "setFloat32", 2),
     M("DataViewPrototype", SV("setFloat64"), "DataView", "setFloat64", 2),
     M("DataViewPrototype", SV("setInt8"), "DataView", "setInt8", 2),
     M("DataViewPrototype", SV("setInt16"), "DataView", "setInt16", 2),
     M("DataViewPrototype", SV("setInt32"), "DataView", "setInt32", 2),
     M("DataViewPrototype", SV("setUint8"), "DataView", "setUint8", 2),
     M("DataViewPrototype", SV("setUint16"), "DataView", "setUint16", 2),
     M("DataViewPrototype", SV("setUint32"), "DataView", "setUint32", 2),
     V("DataViewPrototype", SymToStringTag, SV("DataView"), FALSE, FALSE, TRUE),
     GlobalLink("DataView", N("DataView")) >>

\* The DataView constructor and DataView.prototype (§25.3.2 to §25.3.4). A get method's
\* littleEndian defaults to false, as ToBoolean(undefined) is.
DataViewBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" -> DataViewConstruct(s, Arg(args, 1), Arg(args, 2), Arg(args, 3), nt)
    [] ~IsDataView(s, this) -> ThrowTypeError(s)
    [] m = "buffer" -> Ok(s, O(s, this).slots.buffer)
    [] m = "byteLength" -> Ok(s, IntV(IF IsViewOutOfBounds(s, this) THEN 0 ELSE GetViewByteLength(s, this)))
    [] m = "byteOffset" -> Ok(s, IntV(IF IsViewOutOfBounds(s, this) THEN 0 ELSE O(s, this).slots.byteOffset))
    [] m \in DataViewGetters -> GetViewValue(s, this, Arg(args, 1), Arg(args, 2), DataViewType(m))
    [] OTHER -> SetViewValue(s, this, Arg(args, 1), Arg(args, 3), DataViewType(m), Arg(args, 2))
