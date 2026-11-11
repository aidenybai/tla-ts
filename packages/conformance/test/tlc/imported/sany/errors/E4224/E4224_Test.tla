(*---
description: SANY reports E4224. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4224_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Same identifier used for different symbol types in extended modules. For
example, in one module the symbol is an operator; in another, a constant.
---- MODULE E4224_Test ----
EXTENDS Naturals, E4224_Extended
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file E4224_Test
    | In module E4224_Test
    | Cannot find source file for module E4224_Extended imported in module E4224_Test.
    | *** Errors: 1
    | In module E4224_Test
    | Cannot find source file for module E4224_Extended imported in module E4224_Test.
    3002:1 Parsing or semantic analysis failed.
---*)
