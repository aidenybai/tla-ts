(*---
description: VARIABLE Declaration. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unit.txt
features:
  - sany-syntax
outcome: config-error
---*)
---- MODULE unit_variable_declaration ----
VARIABLE a, b, c
VARIABLES x, y, z
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
