(*---
description: Prefix Operator Definition. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/prefix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE prefix_op_prefix_operator_definition ----

~x == 1
\lnot x == 2
\neg x == 3
UNION x == 4
SUBSET x == 5
DOMAIN x == 6
-. x == 7
ENABLED x == 8
UNCHANGED x == 9
[] x == 10
<> x == 11

====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 20
    | line 10, col 1 to line 10, col 7 of module prefix_op_prefix_operator_definition
    | Operator \lnot already defined or declared.
    | line 10, col 1 to line 10, col 7 of module prefix_op_prefix_operator_definition
    | Symbol \lnot is a built-in operator, and cannot be redefined.
    | line 11, col 1 to line 11, col 12 of module prefix_op_prefix_operator_definition
    | Operator \lnot already defined or declared.
    | line 11, col 1 to line 11, col 12 of module prefix_op_prefix_operator_definition
    | Symbol \lnot is a built-in operator, and cannot be redefined.
    | line 12, col 1 to line 12, col 11 of module prefix_op_prefix_operator_definition
    | Operator \lnot already defined or declared.
    | line 12, col 1 to line 12, col 11 of module prefix_op_prefix_operator_definition
    | Symbol \lnot is a built-in operator, and cannot be redefined.
    | line 13, col 1 to line 13, col 12 of module prefix_op_prefix_operator_definition
    | Operator UNION already defined or declared.
    | line 13, col 1 to line 13, col 12 of module prefix_op_prefix_operator_definition
    | Symbol UNION is a built-in operator, and cannot be redefined.
    | line 14, col 1 to line 14, col 13 of module prefix_op_prefix_operator_definition
    | Operator SUBSET already defined or declared.
    | line 14, col 1 to line 14, col 13 of module prefix_op_prefix_operator_definition
    | Symbol SUBSET is a built-in operator, and cannot be redefined.
    | line 15, col 1 to line 15, col 13 of module prefix_op_prefix_operator_definition
    | Operator DOMAIN already defined or declared.
    | line 15, col 1 to line 15, col 13 of module prefix_op_prefix_operator_definition
    | Symbol DOMAIN is a built-in operator, and cannot be redefined.
    | line 17, col 1 to line 17, col 14 of module prefix_op_prefix_operator_definition
    | Operator ENABLED already defined or declared.
    | line 17, col 1 to line 17, col 14 of module prefix_op_prefix_operator_definition
    | Symbol ENABLED is a built-in operator, and cannot be redefined.
    | line 18, col 1 to line 18, col 16 of module prefix_op_prefix_operator_definition
    | Operator UNCHANGED already defined or declared.
    | line 18, col 1 to line 18, col 16 of module prefix_op_prefix_operator_definition
    | Symbol UNCHANGED is a built-in operator, and cannot be redefined.
    | line 19, col 1 to line 19, col 10 of module prefix_op_prefix_operator_definition
    | Operator [] already defined or declared.
    | line 19, col 1 to line 19, col 10 of module prefix_op_prefix_operator_definition
    | Symbol [] is a built-in operator, and cannot be redefined.
    | line 20, col 1 to line 20, col 10 of module prefix_op_prefix_operator_definition
    | Operator <> already defined or declared.
    | line 20, col 1 to line 20, col 10 of module prefix_op_prefix_operator_definition
    | Symbol <> is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
