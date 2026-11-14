(*---
description: The syntax corpus case "Multiple Recursive Declarations" in recursive.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/recursive.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE recursive_multiple_recursive_declarations ----
RECURSIVE f(_), g(_)
f(x) == f(x)
g(x) == g(x)
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./recursive_multiple_recursive_declarations.tla", line 11, characters 1-20

    Recursive operators not supported by TLAPS

     tlapm ending abnormally with Failure("Expr.Anon: Recursive")
---*)
