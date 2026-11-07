(*---
description: Two definitions under synonym spellings are one symbol defined twice.
ref: "tla2sany/parser/Operators.java#resolveSynonym"
features: [operators]
outcome: parse-error
---*)
---- MODULE synonym_redefinition_conflict ----
a (+) b == 1
a \oplus b == 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 9, col 1 to line 9, col 15 of module synonym_redefinition_conflict
    | Multiple declarations or definitions for symbol \oplus.  
    | This duplicates the one at line 8, col 1 to line 8, col 12 of module synonym_redefinition_conflict.
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 15 of module synonym_redefinition_conflict
    | Operator \oplus already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
