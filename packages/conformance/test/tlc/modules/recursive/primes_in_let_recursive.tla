(*---
description: The prime check covers LET-level recursive operators.
ref: "tla2sany/semantic/ModuleNode.java#levelCheck"
features: [recursive]
outcome: parse-error
---*)
---- MODULE primes_in_let_recursive ----
VARIABLE v
A == LET RECURSIVE F(_)
         F(a) == a'
     IN F(v)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 10 to line 10, col 19 of module primes_in_let_recursive
    | Argument 1 of recursive operator F is primed
    3002:1 Parsing or semantic analysis failed.
---*)
