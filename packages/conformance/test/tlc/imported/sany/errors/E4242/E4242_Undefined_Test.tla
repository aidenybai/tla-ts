(*---
description: SANY reports E4242. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4242_Undefined_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Cannot substitute an undefined symbol in a module.
---- MODULE E4242_Undefined_Test ----
---- MODULE Inner ----
====
INSTANCE Inner WITH c <- 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 21 to line 12, col 21 of module E4242_Undefined_Test
    | Identifier 'c' is not a legal target of a substitution. 
    | A legal target must be a declared CONSTANT or VARIABLE in the module being instantiated. 
    | (Also, check for warnings about multiple declarations of this same identifier.)
    3002:1 Parsing or semantic analysis failed.
---*)
