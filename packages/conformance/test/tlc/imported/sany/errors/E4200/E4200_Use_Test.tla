(*---
description: SANY reports E4200. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4200_Use_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
One of the most basic errors there is: referring to an undefined symbol.
---- MODULE E4200_Use_Test ----
USE DEF DoesNotExist
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 10, col 9 to line 10, col 20 of module E4200_Use_Test
    | Unknown operator: `DoesNotExist'.
    | line 10, col 9 to line 10, col 20 of module E4200_Use_Test
    | DEF clause entry should describe a defined operator.
    | line 10, col 1 to line 10, col 20 of module E4200_Use_Test
    | Empty USE or HIDE statement.
    3002:1 Parsing or semantic analysis failed.
---*)
