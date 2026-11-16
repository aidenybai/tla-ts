(*---
description: The syntax corpus case "Tuple Literal" in expressions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/expressions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE expressions_tuple_literal ----
EXTENDS TestPrelude
op == <<a, <<b, c>>>>
====
---- MODULE TestPrelude ----
VARIABLES a, b, c
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./expressions_tuple_literal.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./expressions_tuple_literal.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
