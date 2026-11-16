(*---
description: 4201 fires across synonyms of one operator.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_synonym_cross_spelling ----
a \oplus b == 1
a (+) b == 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 9, col 1 to line 9, col 12 of module redefined_synonym_cross_spelling
    | Multiple declarations or definitions for symbol \oplus.  
    | This duplicates the one at line 8, col 1 to line 8, col 15 of module redefined_synonym_cross_spelling.
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 12 of module redefined_synonym_cross_spelling
    | Operator \oplus already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
