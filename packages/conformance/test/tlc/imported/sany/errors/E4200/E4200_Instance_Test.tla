(*---
description: SANY reports E4200. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4200_Instance_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
One of the most basic errors there is: referring to an undefined symbol.
---- MODULE E4200_Instance_Test ----
---- MODULE Inner ----
====
import == INSTANCE Inner
op == import!DoesNotExist
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 7 to line 13, col 25 of module E4200_Instance_Test
    | Unknown operator: `import!DoesNotExist'.
    3002:1 Parsing or semantic analysis failed.
---*)
