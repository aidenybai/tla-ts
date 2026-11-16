(*---
description: "\\cap may be applied in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_builtin_cap ----
Test == \cap({1}, {1}) = {1}
====

(*--- recorded
all:
  exit: 0
---*)
