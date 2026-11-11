(*---
description: CONSTANT Declaration. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unit.txt
features:
  - sany-syntax
outcome: config-error
---*)
---- MODULE unit_constant_declaration ----
CONSTANT x, y, z
CONSTANTS f(_, _), _+_, -._, _^+
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter + is not assigned a value by the configuration file.
---*)
