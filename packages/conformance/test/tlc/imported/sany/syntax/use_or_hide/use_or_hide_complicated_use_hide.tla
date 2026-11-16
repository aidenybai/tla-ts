(*---
description: Complicated Use & Hide. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/use_or_hide.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE use_or_hide_complicated_use_hide ----
USE x, 1 + 3
HIDE DEFS -., *, ^+
USE x DEF z, x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 15
    | line 9, col 5 to line 9, col 5 of module use_or_hide_complicated_use_hide
    | Unknown operator: `x'.
    | line 9, col 10 to line 9, col 10 of module use_or_hide_complicated_use_hide
    | Could not find declaration or definition of symbol '+'.
    | line 9, col 8 to line 9, col 12 of module use_or_hide_complicated_use_hide
    | Couldn't resolve infix operator symbol `+'.
    | line 10, col 11 to line 10, col 12 of module use_or_hide_complicated_use_hide
    | Unknown operator: `-.'.
    | line 10, col 11 to line 10, col 12 of module use_or_hide_complicated_use_hide
    | DEF clause entry should describe a defined operator.
    | line 10, col 15 to line 10, col 15 of module use_or_hide_complicated_use_hide
    | Unknown operator: `*'.
    | line 10, col 15 to line 10, col 15 of module use_or_hide_complicated_use_hide
    | DEF clause entry should describe a defined operator.
    | line 10, col 18 to line 10, col 19 of module use_or_hide_complicated_use_hide
    | Unknown operator: `^+'.
    | line 10, col 18 to line 10, col 19 of module use_or_hide_complicated_use_hide
    | DEF clause entry should describe a defined operator.
    | line 10, col 1 to line 10, col 19 of module use_or_hide_complicated_use_hide
    | Empty USE or HIDE statement.
    | line 11, col 5 to line 11, col 5 of module use_or_hide_complicated_use_hide
    | Unknown operator: `x'.
    | line 11, col 11 to line 11, col 11 of module use_or_hide_complicated_use_hide
    | Unknown operator: `z'.
    | line 11, col 11 to line 11, col 11 of module use_or_hide_complicated_use_hide
    | DEF clause entry should describe a defined operator.
    | line 11, col 14 to line 11, col 14 of module use_or_hide_complicated_use_hide
    | Unknown operator: `x'.
    | line 11, col 14 to line 11, col 14 of module use_or_hide_complicated_use_hide
    | DEF clause entry should describe a defined operator.
    3002:1 Parsing or semantic analysis failed.
---*)
