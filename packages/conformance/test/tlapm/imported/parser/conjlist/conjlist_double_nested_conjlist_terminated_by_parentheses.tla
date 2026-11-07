(*---
description: The syntax corpus case "Double-Nested Conjlist Terminated by Parentheses" in conjlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/conjlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE conjlist_double_nested_conjlist_terminated_by_parentheses ----
EXTENDS TestPrelude
op ==
  /\ 1
  /\  /\ 2 + (
        /\ 3
        /\ 4
          )
      /\ 5
  /\ 6
====
---- MODULE TestPrelude ----
CONSTANT _ + _
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./conjlist_double_nested_conjlist_terminated_by_parentheses.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./conjlist_double_nested_conjlist_terminated_by_parentheses.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
