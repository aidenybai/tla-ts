(*---
description: SANY reports E4201. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4201_Function_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If a symbol is already defined, its name cannot be re-used as a function.
---- MODULE E4201_Function_Test ----
f == 0
f[x \in {}] == 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 1 to line 11, col 16 of module E4201_Function_Test
    | Function name `f' already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
