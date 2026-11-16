(*---
description: The syntax corpus case "RECURSIVE inside LET/IN" in let_in.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/let_in.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE let_in_recursive_inside_let_in ----
EXTENDS TestPrelude
op ==
  LET
    RECURSIVE f(_)
    f(n) == IF n =< 0 THEN 1 ELSE n * f(n-1)
  IN f(5)
====
---- MODULE TestPrelude ----
x =< y == TRUE
x * y == 0
x - y == 0
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./let_in_recursive_inside_let_in.tla", line 12, character 6
    Unexpected keyword RECURSIVE

    @type: warning
    @msg: File "./let_in_recursive_inside_let_in.tla", line 12, character 6

    Unexpected keyword RECURSIVE

    File "./let_in_recursive_inside_let_in.tla", line 12, character 6
    Unexpected keyword RECURSIVE
    File "<unknown>":
    Error: Could not parse "./let_in_recursive_inside_let_in.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
