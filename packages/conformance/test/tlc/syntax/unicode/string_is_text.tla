(*---
description: A Unicode operator in a string is one character of text.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE string_is_text ----
EXTENDS Sequences
Test == Len("∧") = 1
====

(*--- recorded
all:
  exit: 0
---*)
