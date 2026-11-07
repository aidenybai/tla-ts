(*---
description: The syntax corpus case "Nested Tuple" in tuples.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/tuples.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE tuples_nested_tuple ----
EXTENDS TestPrelude
op == <<<<x, y>>, <<z>>>> 
====
---- MODULE TestPrelude ----
VARIABLES x, y, z
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./tuples_nested_tuple.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./tuples_nested_tuple.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
