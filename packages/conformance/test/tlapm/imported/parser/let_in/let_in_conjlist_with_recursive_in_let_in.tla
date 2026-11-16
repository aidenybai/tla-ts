(*---
description: The syntax corpus case "Conjlist with RECURSIVE in LET/IN" in let_in.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/let_in.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE let_in_conjlist_with_recursive_in_let_in ----
EXTENDS TestPrelude
op ==
  /\ LET
       RECURSIVE f
       f == f
     IN P
  /\ Q
====
---- MODULE TestPrelude ----
P == TRUE
Q == TRUE
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./let_in_conjlist_with_recursive_in_let_in.tla", line 12, character 6
    Unexpected keyword RECURSIVE

    @type: warning
    @msg: File "./let_in_conjlist_with_recursive_in_let_in.tla", line 12, character 6

    Unexpected keyword RECURSIVE

    File "./let_in_conjlist_with_recursive_in_let_in.tla", line 12, character 6
    Unexpected keyword RECURSIVE
    File "<unknown>":
    Error: Could not parse "./let_in_conjlist_with_recursive_in_let_in.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
