(*---
description: The syntax corpus case "Nested Parentheses" in expressions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/expressions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE expressions_nested_parentheses ----
EXTENDS TestPrelude
op == ((((x))))
====
---- MODULE TestPrelude ----
VARIABLES x
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./expressions_nested_parentheses.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./expressions_nested_parentheses.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
