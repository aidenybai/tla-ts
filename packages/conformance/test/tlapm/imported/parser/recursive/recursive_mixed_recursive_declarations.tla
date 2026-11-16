(*---
description: The syntax corpus case "Mixed Recursive Declarations" in recursive.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/recursive.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE recursive_mixed_recursive_declarations ----
RECURSIVE f(_), g, h(_, _, _), _+_, -. _, _ ^+
f(x) == f(x)
g == g
h(x, y, z) == h(x, y, z)
x + y == x + y
-. x == -. x
x ^+ == x ^+
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./recursive_mixed_recursive_declarations.tla", line 11, characters 1-46

    Recursive operators not supported by TLAPS

     tlapm ending abnormally with Failure("Expr.Anon: Recursive")
---*)
