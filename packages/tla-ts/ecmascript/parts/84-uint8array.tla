\* Uint8Array to and from base64 and hex (§23.3). Bytes are integers 0 to 255, and a base64 chunk
\* holds the values 0 to 63 of its characters in the standard alphabet.

\* ValidateUint8Array (§23.3.3.1), for an access that writes or only reads, as
\* proposal-immutable-arraybuffer adds.
ValidateUint8Array(s, ta, isWrite) ==
  IF ~IsTypedArray(s, ta) \/ O(s, ta).slots.name # "Uint8Array" THEN ThrowTypeError(s)
  ELSE IF isWrite /\ IsImmutableBuffer(s, O(s, ta).slots.buffer) THEN ThrowTypeError(s)
  ELSE Ok(s, Empty)

\* GetUint8ArrayBytes (§23.3.3.2).
GetUint8ArrayBytes(s, ta) ==
  LET len == ValidateTypedArrayBounds(s, ta) IN IF IsAbrupt(len) THEN len
  ELSE Ok(len.s, BufferBytes(len.s, O(len.s, ta).slots.buffer, O(len.s, ta).slots.byteOffset, Val(len)))

\* SetUint8ArrayBytes (§23.3.3.3).
SetUint8ArrayBytes(s, into, bytes) == SetBufferBytes(s, O(s, into).slots.buffer, O(s, into).slots.byteOffset, bytes)

\* The alphabet or lastChunkHandling option: the name that allowed maps the option's units to, or
\* fallback when it is undefined.
GetBase64Option(s, options, key, allowed, fallback) ==
  LET value == Get(s, options, key) IN IF IsAbrupt(value) THEN value
  ELSE IF Val(value) = Undefined THEN Ok(value.s, fallback)
  ELSE IF IsString(Val(value)) /\ Val(value).value \in DOMAIN allowed THEN Ok(value.s, allowed[Val(value).value])
  ELSE ThrowTypeError(value.s)
Base64Alphabets == (N("base64") :> "base64") @@ (N("base64url") :> "base64url")
LastChunkHandlings ==
  (N("loose") :> "loose") @@ (N("strict") :> "strict") @@ (N("stop-before-partial") :> "stop-before-partial")

Base64Digits == N("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/")
Base64UrlDigits == N("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_")
HexDigits == N("0123456789abcdef")

\* The value of a code unit in the standard base64 alphabet, or -1.
Base64Value(u) ==
  CASE u >= 65 /\ u <= 90 -> u - 65
    [] u >= 97 /\ u <= 122 -> u - 71
    [] u >= 48 /\ u <= 57 -> u + 4
    [] u = 43 -> 62
    [] u = 47 -> 63
    [] OTHER -> -1

\* The value of a hex digit, or -1.
HexValue(u) ==
  CASE u >= 48 /\ u <= 57 -> u - 48
    [] u >= 97 /\ u <= 102 -> u - 87
    [] u >= 65 /\ u <= 70 -> u - 55
    [] OTHER -> -1

\* SkipAsciiWhitespace (§23.3.3.4).
SkipAsciiWhitespace(units, index) ==
  IF index < Len(units) /\ units[index + 1] \in {9, 10, 12, 13, 32} THEN SkipAsciiWhitespace(units, index + 1) ELSE index

\* DecodeFullLengthBase64Chunk (§23.3.3.6).
DecodeFullLengthBase64Chunk(chunk) ==
  LET n == ((chunk[1] * 64 + chunk[2]) * 64 + chunk[3]) * 64 + chunk[4]
  IN <<n \div 65536, (n \div 256) % 256, n % 256>>

\* DecodeFinalBase64Chunk (§23.3.3.5): [ok, bytes], with ok FALSE for the SyntaxError.
DecodeFinalBase64Chunk(chunk, throwOnExtraBits) ==
  LET bytes == DecodeFullLengthBase64Chunk(chunk \o Repeat(0, 4 - Len(chunk)))
  IN [ok |-> ~throwOnExtraBits \/ bytes[Len(chunk)] = 0, bytes |-> SubSeq(bytes, 1, Len(chunk) - 1)]

\* The result Record of FromBase64 and FromHex, with error whether it is a SyntaxError.
DecodeResult(read, bytes, error) == [read |-> read, bytes |-> bytes, error |-> error]

\* FromBase64 (§23.3.3.7), with maxLength an integer. Leaving it out is giving one more than the
\* length of units, which no result reaches.
FromBase64(units, alphabet, lastChunkHandling, maxLength) ==
  IF maxLength = 0 THEN DecodeResult(0, <<>>, FALSE)
  ELSE FromBase64From(units, alphabet, lastChunkHandling, maxLength, 0, 0, <<>>, <<>>)
FromBase64From(units, alphabet, lastChunkHandling, maxLength, from, read, bytes, chunk) ==
  LET index == SkipAsciiWhitespace(units, from)
      length == Len(units)
  IN IF index = length THEN
       CASE chunk = <<>> -> DecodeResult(length, bytes, FALSE)
         [] lastChunkHandling = "stop-before-partial" -> DecodeResult(read, bytes, FALSE)
         [] lastChunkHandling = "strict" \/ Len(chunk) = 1 -> DecodeResult(read, bytes, TRUE)
         [] OTHER -> DecodeResult(length, bytes \o DecodeFinalBase64Chunk(chunk, FALSE).bytes, FALSE)
     ELSE LET u == units[index + 1] IN
     IF u = 61 THEN
       IF Len(chunk) < 2 THEN DecodeResult(read, bytes, TRUE) ELSE
       LET padded == SkipAsciiWhitespace(units, index + 1) IN
       IF Len(chunk) = 2 /\ padded = length THEN DecodeResult(read, bytes, lastChunkHandling # "stop-before-partial") ELSE
       LET end == IF Len(chunk) = 2 /\ units[padded + 1] = 61 THEN SkipAsciiWhitespace(units, padded + 1) ELSE padded
           final == DecodeFinalBase64Chunk(chunk, lastChunkHandling = "strict")
       IN IF end < length \/ ~final.ok THEN DecodeResult(read, bytes, TRUE)
          ELSE DecodeResult(length, bytes \o final.bytes, FALSE)
     ELSE LET value == CASE alphabet = "base64url" /\ u \in {43, 47} -> -1
                         [] alphabet = "base64url" /\ u = 45 -> 62
                         [] alphabet = "base64url" /\ u = 95 -> 63
                         [] OTHER -> Base64Value(u)
              remaining == maxLength - Len(bytes)
              next == Append(chunk, value)
              decoded == bytes \o DecodeFullLengthBase64Chunk(next)
     IN CASE value < 0 -> DecodeResult(read, bytes, TRUE)
          [] (remaining = 1 /\ Len(chunk) = 2) \/ (remaining = 2 /\ Len(chunk) = 3) -> DecodeResult(read, bytes, FALSE)
          [] Len(next) < 4 -> FromBase64From(units, alphabet, lastChunkHandling, maxLength, index + 1, read, bytes, next)
          [] Len(decoded) = maxLength -> DecodeResult(index + 1, decoded, FALSE)
          [] OTHER -> FromBase64From(units, alphabet, lastChunkHandling, maxLength, index + 1, index + 1, decoded, <<>>)

\* FromHex (§23.3.3.8), with maxLength an integer.
FromHex(units, maxLength) ==
  IF Len(units) % 2 # 0 THEN DecodeResult(0, <<>>, TRUE) ELSE FromHexFrom(units, maxLength, 0, <<>>)
FromHexFrom(units, maxLength, read, bytes) ==
  IF read >= Len(units) \/ Len(bytes) >= maxLength THEN DecodeResult(read, bytes, FALSE)
  ELSE LET high == HexValue(units[read + 1])
           low == HexValue(units[read + 2])
  IN IF high < 0 \/ low < 0 THEN DecodeResult(read, bytes, TRUE)
     ELSE FromHexFrom(units, maxLength, read + 2, Append(bytes, high * 16 + low))

\* The base64 encoding of section 4 or 5 of RFC 4648, three bytes at a time from index i.
EncodeBase64(bytes, i, digits, omitPadding) ==
  IF i > Len(bytes) THEN <<>> ELSE
  LET left == Len(bytes) - i + 1
      n == (bytes[i] * 256 + (IF left > 1 THEN bytes[i + 1] ELSE 0)) * 256 + (IF left > 2 THEN bytes[i + 2] ELSE 0)
      values == <<n \div 262144, (n \div 4096) % 64, (n \div 64) % 64, n % 64>>
      count == IF left >= 3 THEN 4 ELSE left + 1
  IN [k \in 1..count |-> digits[values[k] + 1]] \o (IF omitPadding THEN <<>> ELSE Repeat(61, 4 - count)) \o
     EncodeBase64(bytes, i + 3, digits, omitPadding)

\* A new Uint8Array of bytes, for fromBase64 and fromHex.
Uint8ArrayOf(s, bytes) ==
  LET ta == AllocateTypedArray(s, "Uint8Array", Intrinsic(s, "Uint8Array"), NumFromInt(Len(bytes))) IN
  IF IsAbrupt(ta) THEN ta ELSE Ok(SetUint8ArrayBytes(ta.s, Val(ta), bytes), Val(ta))

\* The rest of setFromBase64 and setFromHex: writes what result decoded, then throws its error or
\* returns the counts.
SetFromResult(s, into, result) ==
  LET written == SetUint8ArrayBytes(s, into, result.bytes) IN
  IF result.error THEN ThrowError(written, "SyntaxError") ELSE
  LET o == OrdinaryObjectCreate(written, Intrinsic(written, "ObjectPrototype"))
  IN Ok(SetO(o.s, Val(o), WithDataProps(O(o.s, Val(o)), <<<<SV("read"), IntV(result.read)>>,
                                                          <<SV("written"), IntV(Len(result.bytes))>>>>)),
        Val(o))

\* The alphabet and lastChunkHandling options of fromBase64 and setFromBase64.
GetDecodeOptions(s, options) ==
  LET opts == GetOptionsObject(s, options) IN IF IsAbrupt(opts) THEN opts ELSE
  LET alphabet == GetBase64Option(opts.s, Val(opts), SV("alphabet"), Base64Alphabets, "base64") IN
  IF IsAbrupt(alphabet) THEN alphabet ELSE
  LET handling == GetBase64Option(alphabet.s, Val(opts), SV("lastChunkHandling"), LastChunkHandlings, "loose")
  IN IF IsAbrupt(handling) THEN handling
     ELSE Ok(handling.s, [alphabet |-> Val(alphabet), lastChunkHandling |-> Val(handling)])

Uint8ArrayProperties ==
  << M("Uint8ArrayPrototype", SV("toBase64"), "Uint8Array", "toBase64", 0),
     M("Uint8ArrayPrototype", SV("setFromBase64"), "Uint8Array", "setFromBase64", 1),
     M("Uint8ArrayPrototype", SV("toHex"), "Uint8Array", "toHex", 0),
     M("Uint8ArrayPrototype", SV("setFromHex"), "Uint8Array", "setFromHex", 1),
     M("Uint8Array", SV("fromBase64"), "Uint8Array", "fromBase64", 1),
     M("Uint8Array", SV("fromHex"), "Uint8Array", "fromHex", 1) >>

\* Uint8Array.fromBase64, Uint8Array.fromHex, and the Uint8Array.prototype methods (§23.3.1, §23.3.2).
Uint8ArrayBuiltin(s, f, m, this, args, nt) ==
  LET a1 == Arg(args, 1) IN
  CASE m = "fromBase64" ->
         IF ~IsString(a1) THEN ThrowTypeError(s) ELSE
         LET options == GetDecodeOptions(s, Arg(args, 2)) IN IF IsAbrupt(options) THEN options ELSE
         LET result == FromBase64(a1.value, Val(options).alphabet, Val(options).lastChunkHandling, Len(a1.value) + 1)
         IN IF result.error THEN ThrowError(options.s, "SyntaxError") ELSE Uint8ArrayOf(options.s, result.bytes)
    [] m = "fromHex" ->
         IF ~IsString(a1) THEN ThrowTypeError(s) ELSE
         LET result == FromHex(a1.value, Len(a1.value) + 1)
         IN IF result.error THEN ThrowError(s, "SyntaxError") ELSE Uint8ArrayOf(s, result.bytes)
    [] m = "setFromBase64" ->
         LET v == ValidateUint8Array(s, this, TRUE) IN IF IsAbrupt(v) THEN v
         ELSE IF ~IsString(a1) THEN ThrowTypeError(s) ELSE
         LET options == GetDecodeOptions(s, Arg(args, 2)) IN IF IsAbrupt(options) THEN options ELSE
         LET len == ValidateTypedArrayBounds(options.s, this) IN IF IsAbrupt(len) THEN len
         ELSE SetFromResult(len.s, this, FromBase64(a1.value, Val(options).alphabet, Val(options).lastChunkHandling, Val(len)))
    [] m = "setFromHex" ->
         LET v == ValidateUint8Array(s, this, TRUE) IN IF IsAbrupt(v) THEN v
         ELSE IF ~IsString(a1) THEN ThrowTypeError(s) ELSE
         LET len == ValidateTypedArrayBounds(s, this) IN IF IsAbrupt(len) THEN len
         ELSE SetFromResult(len.s, this, FromHex(a1.value, Val(len)))
    [] m = "toBase64" ->
         LET v == ValidateUint8Array(s, this, FALSE) IN IF IsAbrupt(v) THEN v ELSE
         LET opts == GetOptionsObject(s, a1) IN IF IsAbrupt(opts) THEN opts ELSE
         LET alphabet == GetBase64Option(opts.s, Val(opts), SV("alphabet"), Base64Alphabets, "base64") IN
         IF IsAbrupt(alphabet) THEN alphabet ELSE
         LET omitPadding == Get(alphabet.s, Val(opts), SV("omitPadding")) IN IF IsAbrupt(omitPadding) THEN omitPadding ELSE
         LET bytes == GetUint8ArrayBytes(omitPadding.s, this) IN IF IsAbrupt(bytes) THEN bytes
         ELSE Ok(bytes.s, Str(EncodeBase64(Val(bytes), 1, IF Val(alphabet) = "base64" THEN Base64Digits ELSE Base64UrlDigits,
                                           ToBooleanValue(Val(omitPadding)))))
    [] m = "toHex" ->
         LET v == ValidateUint8Array(s, this, FALSE) IN IF IsAbrupt(v) THEN v ELSE
         LET bytes == GetUint8ArrayBytes(s, this) IN IF IsAbrupt(bytes) THEN bytes
         ELSE Ok(bytes.s, Str(FoldLeftSeq([i \in DOMAIN Val(bytes) |->
                                             <<HexDigits[Val(bytes)[i] \div 16 + 1], HexDigits[(Val(bytes)[i] % 16) + 1]>>])))
