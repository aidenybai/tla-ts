(*---
description: The module sany/equivalence/04_TheoremRefTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/04_TheoremRefTest.tla
features:
  - tlapm-test
mode: obligations
outcome: incomplete
---*)
---- MODULE 04_TheoremRefTest ----
THEOREM thm == TRUE
op == thm
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Missing proof at File "./04_TheoremRefTest.tla", line 10, character 20
    File "./04_TheoremRefTest.tla", line 9, character 1 to line 12, character 4:
    [ERROR]: Proof incomplete in module "04_TheoremRefTest": 1 missing, 0 omitted proof step(s).
---*)
