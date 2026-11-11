(*---
description: Two nested modules with one name is an error.
ref: "tla2sany/semantic/SymbolTable.java#addModule"
features: [nested]
outcome: parse-error
---*)
---- MODULE two_siblings_same_name ----
---- MODULE I ----
====
---- MODULE I ----
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 11, col 4 of module two_siblings_same_name
    | Multiply-defined module 'I': this definition or declaration conflicts 
    | with the one at line 8, col 1 to line 9, col 4 of module two_siblings_same_name.
    3002:1 Parsing or semantic analysis failed.
---*)
