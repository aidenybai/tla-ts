(*---
description: z3test's regression regressions/smt2/consequence_fd.smt2.
ref: regressions/smt2/consequence_fd.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic QF_FD)
(declare-datatypes ((Color 0)) (((Red) (Blue) (Green) (DarkBlue) (MetallicBlack) (MetallicSilver) (Silver) (Black))))
(declare-fun color2 () Color)
(declare-fun color1 () Color)
(assert (= color1 color2))
(declare-fun color3 () Color)
(assert (= color2 color3))
(declare-fun color4 () Color)

(get-consequences () (
color1
color2
color3
color4))
(declare-fun fix-color1 () Bool)
(assert (=> fix-color1 (= color1 MetallicBlack)))
(get-consequences (
fix-color1) (
color1
color2
color3
color4))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat

    sat

    (=> fix-color1 (= color1 MetallicBlack))
    (=> fix-color1 (= color2 MetallicBlack))
    (=> fix-color1 (= color3 MetallicBlack))
---*)
