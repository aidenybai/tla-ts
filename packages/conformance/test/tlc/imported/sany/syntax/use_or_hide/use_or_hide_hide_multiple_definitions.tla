(*---
description: Hide Multiple Definitions. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/use_or_hide.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE use_or_hide_hide_multiple_definitions ----
HIDE X, Y
HIDE DEFS X, Y
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 8
    | line 9, col 6 to line 9, col 6 of module use_or_hide_hide_multiple_definitions
    | Unknown operator: `X'.
    | line 9, col 9 to line 9, col 9 of module use_or_hide_hide_multiple_definitions
    | Unknown operator: `Y'.
    | In module --TLA+ BUILTINS--
    | The only expression allowed as a fact in a HIDE is 
    | the name of a theorem, assumption, or step.
    | line 10, col 11 to line 10, col 11 of module use_or_hide_hide_multiple_definitions
    | Unknown operator: `X'.
    | line 10, col 11 to line 10, col 11 of module use_or_hide_hide_multiple_definitions
    | DEF clause entry should describe a defined operator.
    | line 10, col 14 to line 10, col 14 of module use_or_hide_hide_multiple_definitions
    | Unknown operator: `Y'.
    | line 10, col 14 to line 10, col 14 of module use_or_hide_hide_multiple_definitions
    | DEF clause entry should describe a defined operator.
    | line 10, col 1 to line 10, col 14 of module use_or_hide_hide_multiple_definitions
    | Empty USE or HIDE statement.
    3002:1 Parsing or semantic analysis failed.
---*)
