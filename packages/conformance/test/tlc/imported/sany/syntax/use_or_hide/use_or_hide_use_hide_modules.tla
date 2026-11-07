(*---
description: Use & Hide Modules. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/use_or_hide.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE use_or_hide_use_hide_modules ----
USE x, MODULE M, 1 + 3
HIDE DEFS MODULE M, -., *, ^+
USE x, MODULE M DEF MODULE M, x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 17
    | line 9, col 5 to line 9, col 5 of module use_or_hide_use_hide_modules
    | Unknown operator: `x'.
    | line 9, col 15 to line 9, col 15 of module use_or_hide_use_hide_modules
    | Module `M' used without being extended or instantiated.
    | line 9, col 20 to line 9, col 20 of module use_or_hide_use_hide_modules
    | Could not find declaration or definition of symbol '+'.
    | line 9, col 18 to line 9, col 22 of module use_or_hide_use_hide_modules
    | Couldn't resolve infix operator symbol `+'.
    | line 10, col 18 to line 10, col 18 of module use_or_hide_use_hide_modules
    | Module `M' used without being extended or instantiated.
    | line 10, col 21 to line 10, col 22 of module use_or_hide_use_hide_modules
    | Unknown operator: `-.'.
    | line 10, col 21 to line 10, col 22 of module use_or_hide_use_hide_modules
    | DEF clause entry should describe a defined operator.
    | line 10, col 25 to line 10, col 25 of module use_or_hide_use_hide_modules
    | Unknown operator: `*'.
    | line 10, col 25 to line 10, col 25 of module use_or_hide_use_hide_modules
    | DEF clause entry should describe a defined operator.
    | line 10, col 28 to line 10, col 29 of module use_or_hide_use_hide_modules
    | Unknown operator: `^+'.
    | line 10, col 28 to line 10, col 29 of module use_or_hide_use_hide_modules
    | DEF clause entry should describe a defined operator.
    | line 10, col 1 to line 10, col 29 of module use_or_hide_use_hide_modules
    | Empty USE or HIDE statement.
    | line 11, col 5 to line 11, col 5 of module use_or_hide_use_hide_modules
    | Unknown operator: `x'.
    | line 11, col 15 to line 11, col 15 of module use_or_hide_use_hide_modules
    | Module `M' used without being extended or instantiated.
    | line 11, col 28 to line 11, col 28 of module use_or_hide_use_hide_modules
    | Module `M' used without being extended or instantiated.
    | line 11, col 31 to line 11, col 31 of module use_or_hide_use_hide_modules
    | Unknown operator: `x'.
    | line 11, col 31 to line 11, col 31 of module use_or_hide_use_hide_modules
    | DEF clause entry should describe a defined operator.
    3002:1 Parsing or semantic analysis failed.
---*)
