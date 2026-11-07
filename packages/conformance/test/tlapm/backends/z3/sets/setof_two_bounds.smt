(*---
description: >-
  tlapm cannot encode a set image over two bound variables, so it hands Z3 an empty file, on which
  Z3 reaches no verdict.
ref: src/backend/smtlib.ml#pp_print_obligation
outcome: unknown
features:
  - tlapm-bug
---*)

(*--- recorded
all:
  exit: 0
  transcript: unknown
---*)
