(*---
description: 'The syntax corpus case "Named Theorem After Submodule (GH tlaplus/tlaplus #430)" in modules.txt, which tlapm''s parser tests read.'
ref: test/parser/syntax_corpus/modules.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: incomplete
---*)
---- MODULE modules_named_theorem_after_submodule_gh_tlaplus_tlaplus_430 ----
---- MODULE Inner ----
====
THEOREM T == TRUE
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    @type: obligationsnumber
    @count: 0

    Missing proof at File "./modules_named_theorem_after_submodule_gh_tlaplus_tlaplus_430.tla", line 13, character 18
    File "./modules_named_theorem_after_submodule_gh_tlaplus_tlaplus_430.tla", line 10, character 1 to line 14, character 4:
    [ERROR]: Proof incomplete in module "modules_named_theorem_after_submodule_gh_tlaplus_tlaplus_430": 1 missing, 0 omitted proof step(s).
---*)
