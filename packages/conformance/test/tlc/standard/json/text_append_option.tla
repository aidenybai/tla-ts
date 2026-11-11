(*---
description: APPEND adds to a file's lines.
ref: tlc2/module/Json.java#textSerialize
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - IOUtils.tla
---*)
---- MODULE text_append_option ----
EXTENDS Json, IOUtils, TLC, Naturals
Test == /\ Serialize(<<1>>, "out.ndjson", [format |-> "NDJSON", charset |-> "UTF-8", openOptions |-> <<"WRITE", "CREATE", "TRUNCATE_EXISTING">>])
        /\ Serialize(<<2>>, "out.ndjson", [format |-> "NDJSON", charset |-> "UTF-8", openOptions |-> <<"APPEND">>])
        /\ ndJsonDeserialize("out.ndjson") = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
