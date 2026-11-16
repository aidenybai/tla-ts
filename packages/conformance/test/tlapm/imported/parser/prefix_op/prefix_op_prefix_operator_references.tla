(*---
description: The syntax corpus case "Prefix Operator References" in prefix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/prefix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE prefix_op_prefix_operator_references ----
EXTENDS TestPrelude
op == f(
  ~,
  \lnot,
  \neg,
  UNION,
  SUBSET,
  DOMAIN,
  -.,
  ENABLED,
  UNCHANGED,
  [],
  <>
)
====
---- MODULE TestPrelude ----
-. x == x
f(a1(_),a2(_),a3(_),a4(_),a5(_),a6(_),a7(_),a8(_),a9(_),a10(_),a11(_)) == 0
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./prefix_op_prefix_operator_references.tla", line 12, character 6
    incomplete expression

    @type: warning
    @msg: File "./prefix_op_prefix_operator_references.tla", line 12, character 6

    incomplete expression

    File "./prefix_op_prefix_operator_references.tla", line 12, character 6
    incomplete expression
    File "<unknown>":
    Error: Could not parse "./prefix_op_prefix_operator_references.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
