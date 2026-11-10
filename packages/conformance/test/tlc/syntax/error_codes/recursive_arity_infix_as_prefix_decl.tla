(*---
description: "A nonfix definition of an infix symbol is a parse error, so it cannot answer an infix declaration."
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE recursive_arity_infix_as_prefix_decl ----
RECURSIVE _ ++ _
++(a) == a
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "++" at line 9, column 1 and token "_" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file recursive_arity_infix_as_prefix_decl
    | In module recursive_arity_infix_as_prefix_decl
    | Could not parse module recursive_arity_infix_as_prefix_decl from file recursive_arity_infix_as_prefix_decl.tla
    | *** Errors: 1
    | In module recursive_arity_infix_as_prefix_decl
    | Could not parse module recursive_arity_infix_as_prefix_decl from file recursive_arity_infix_as_prefix_decl.tla
    3002:1 Parsing or semantic analysis failed.
---*)
