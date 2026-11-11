(*---
description: A lower case relative of a standard name is free.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE nat_lowercase ----
EXTENDS Naturals
nat == 7
Test == nat = 7
====

(*--- recorded
all:
  exit: 0
---*)
