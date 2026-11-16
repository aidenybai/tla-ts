(*---
description: "⟶ is not a TLA+ token, so a lexical error names it."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
outcome: parse-error
---*)
---- MODULE long_arrow_not_case_arrow ----
Test == CASE TRUE ⟶ TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 19.  Encountered: "\u27f6" (10230), after : ""
    | Fatal errors while parsing TLA+ spec in file long_arrow_not_case_arrow
    | In module long_arrow_not_case_arrow
    | Could not parse module long_arrow_not_case_arrow from file long_arrow_not_case_arrow.tla
    | *** Errors: 1
    | In module long_arrow_not_case_arrow
    | Could not parse module long_arrow_not_case_arrow from file long_arrow_not_case_arrow.tla
    3002:1 Parsing or semantic analysis failed.
---*)
