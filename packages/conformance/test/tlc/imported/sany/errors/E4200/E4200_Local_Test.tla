(*---
description: SANY reports E4200. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4200_Local_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
One of the most basic errors there is: referring to an undefined symbol, or a
symbol that should not be visible.
---- MODULE E4200_Local_Test ----
---- MODULE Inner ----
LOCAL def == 0
====
INSTANCE Inner
op == def
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 15, col 7 to line 15, col 9 of module E4200_Local_Test
    | Unknown operator: `def'.
    3002:1 Parsing or semantic analysis failed.
---*)
