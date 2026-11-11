(*---
description: SANY reports E4201. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4201_VariableName_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If a name has already been used for an operator, it cannot be used as a
variable name.
---- MODULE E4201_VariableName_Test ----
def == TRUE
VARIABLE def
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 10 to line 12, col 12 of module E4201_VariableName_Test
    | Multiply-defined symbol 'def': this definition or declaration conflicts 
    | with the one at line 11, col 1 to line 11, col 11 of module E4201_VariableName_Test.
    3002:1 Parsing or semantic analysis failed.
---*)
