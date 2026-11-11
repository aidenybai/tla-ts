(*---
description: Any run of underscores may precede the first letter.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE many_leading_underscores ----
__a == 7
Test == __a = 7
====

(*--- recorded
all:
  exit: 0
---*)
