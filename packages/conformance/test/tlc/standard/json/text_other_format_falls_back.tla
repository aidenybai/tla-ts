(*---
description: Any other format returns null from Java, so the TLA+ definition is used.
ref: tlc2/module/Json.java#textSerialize
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - IOUtils.tla
---*)
---- MODULE text_other_format_falls_back ----
EXTENDS Json, IOUtils, TLC, Naturals
Test == Serialize(<<1>>, "out.txt", [format |-> "TXT"]) = <<"fallback">>
====

(*--- recorded
all:
  exit: 0
---*)
