(*---
description: The syntax corpus case "Recursive Declaration Without Parameters" in recursive.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/recursive.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE recursive_recursive_declaration_without_parameters ----
RECURSIVE f
f == f
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./recursive_recursive_declaration_without_parameters.tla", line 11, characters 1-11

    Recursive operators not supported by TLAPS

     tlapm ending abnormally with Failure("Expr.Anon: Recursive")
---*)
