----------------------------- MODULE JsonValues -----------------------------
EXTENDS Integers, Json, TLCExt

\* TLC reads a JSON number with Gson, which truncates it toward zero and keeps
\* its low 32 bits.
ASSUME JsonDeserialize("Numbers.json") =
           <<1, -2, 1, -1, 1000, -1294967296, -350287150, 0, 0>>

\* Newline delimited JSON skips blank lines and trims the others.
ASSUME ndJsonDeserialize("Lines.ndjson") = <<1, <<2, "x">>, [a |-> TRUE]>>

\* Gson reads an empty file as null.
ASSUME AssertError(
           "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,\nbut it produced the following error:\nCannot convert value: unsupported JSON value null",
           JsonDeserialize("Empty.json"))

ASSUME AssertError(
           "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,\nbut it produced the following error:\nMissing.json (No such file or directory)",
           JsonDeserialize("Missing.json"))

ASSUME AssertError(
           "Attempted to apply the operator overridden by the Java method\npublic static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,\nbut it produced the following error:\nCannot cast tlc2.value.impl.IntValue to tlc2.value.impl.StringValue",
           JsonSerialize(42, <<1>>))

\* Keys keep the order of the function's domain.
ASSUME ToJson([n \in {-1, 2} |-> n]) = "{\"-1\":-1,\"2\":2}"

\* ToJsonArray converts a function that is not a sequence to an object, but
\* rejects a record and a value that is neither a set nor a function.
ASSUME ToJsonArray([n \in {2, 3} |-> n]) = "{\"2\":2,\"3\":3}"

ASSUME AssertError(
           "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException,\nbut it produced the following error:\nCannot convert value: unsupported value type tlc2.value.impl.RecordValue",
           ToJsonArray([a |-> 1]))

ASSUME AssertError(
           "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException,\nbut it produced the following error:\nCannot convert value: unsupported value type tlc2.value.impl.IntValue",
           ToJsonArray(42))

ASSUME AssertError(
           "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException,\nbut it produced the following error:\nCannot convert value: unsupported value type tlc2.value.impl.SetEnumValue",
           ToJsonObject({1}))

ASSUME AssertError(
           "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.StringValue tlc2.module.Json.toJson(tlc2.value.IValue) throws java.io.IOException,\nbut it produced the following error:\nCannot convert value: unsupported value type tlc2.value.impl.UserValue",
           ToJson(Nat))

ASSUME AssertError(
           "The second argument of JsonSerialize should be a sequence or record, but instead it is:\n{1, 2, 3}",
           JsonSerialize("Unwritten.json", {1, 2, 3}))
=============================================================================
