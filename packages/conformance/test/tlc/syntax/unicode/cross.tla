(*---
description: "× works as \\X."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE cross ----
Test == {1} × {2} = {<<1, 2>>}
====

(*--- recorded
all:
  exit: 0
---*)
