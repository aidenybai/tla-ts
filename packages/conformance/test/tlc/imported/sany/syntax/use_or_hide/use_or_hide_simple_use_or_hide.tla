(*---
description: Simple Use or Hide. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/use_or_hide.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE use_or_hide_simple_use_or_hide ----
USE X, Y
HIDE X
HIDE Y
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 5
    | line 9, col 5 to line 9, col 5 of module use_or_hide_simple_use_or_hide
    | Unknown operator: `X'.
    | line 9, col 8 to line 9, col 8 of module use_or_hide_simple_use_or_hide
    | Unknown operator: `Y'.
    | line 10, col 6 to line 10, col 6 of module use_or_hide_simple_use_or_hide
    | Unknown operator: `X'.
    | In module --TLA+ BUILTINS--
    | The only expression allowed as a fact in a HIDE is 
    | the name of a theorem, assumption, or step.
    | line 11, col 6 to line 11, col 6 of module use_or_hide_simple_use_or_hide
    | Unknown operator: `Y'.
    3002:1 Parsing or semantic analysis failed.
---*)
