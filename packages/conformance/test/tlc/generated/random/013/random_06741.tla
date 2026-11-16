(*---
description: Evaluates a random bool expression, seed 262, number 6741.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06741 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b10331 == CASE TRUE -> 2147483647 [] OTHER -> 2147483647 IN (0 \div -1) \div (CASE FALSE -> 3 [] OTHER -> 3 \div LET b10332 == 2 IN 2147483647)) < (((<<5, 6>>)[0] + IF FALSE THEN <<3, 1, 2>> ELSE 2147483647) - ((-FALSE) \div IF FALSE THEN 2 ELSE 3))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 85 to line 14, col 88 of module random_06741 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 83.
    | Expression starting at line 14, column 83.
    | ExtendableExpr starting at line 14, column 82.
    | Expression starting at line 14, column 82.
    | Case Other Arm starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_06741
    | In module random_06741
    | Could not parse module random_06741 from file random_06741.tla
    | *** Errors: 1
    | In module random_06741
    | Could not parse module random_06741 from file random_06741.tla
    3002:1 Parsing or semantic analysis failed.
---*)
