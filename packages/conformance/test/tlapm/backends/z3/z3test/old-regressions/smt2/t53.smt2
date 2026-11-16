(*---
description: z3test's regression old-regressions/smt2/t53.smt2.
ref: old-regressions/smt2/t53.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(simplify (bvshl #x00ff #x0004))
(simplify (bvshl #x00ff #x0008))
(simplify (bvshl #x00ff #x0000))
(simplify (bvshl #x00aa00bb00cc00dd #x0000000000000000))
(simplify (bvshl #x00aa00bb00cc00dd #x0000000000000008))
(simplify (bvshl #x00aa00bb00cc00dd #x0000000000000010))
(simplify (bvshl #x00aa00bb00cc00dd #x0000000000000020))
(simplify (bvshl #x00aa00bb00cc00dd #x0000000000000030))
(simplify (bvshl #x00aa00bb00cc00dd #x000000000000ffff))
(echo "----")
(simplify (bvlshr #x00ff #x0004))
(simplify (bvlshr #x00ff #x0008))
(simplify (bvlshr #x00ff #x0000))
(simplify (bvlshr #x00aa00bb00cc00dd #x0000000000000000))
(simplify (bvlshr #x00aa00bb00cc00dd #x0000000000000008))
(simplify (bvlshr #x00aa00bb00cc00dd #x0000000000000010))
(simplify (bvlshr #x00aa00bb00cc00dd #x0000000000000020))
(simplify (bvlshr #x00aa00bb00cc00dd #x0000000000000030))
(simplify (bvlshr #x00aa00bb00cc00dd #x000000000000ffff))
(echo "----")
(simplify (bvashr #x00ff #x0004))
(simplify (bvashr #x00ff #x0008))
(simplify (bvashr #x00ff #x0000))
(simplify (bvashr #x00aa00bb00cc00dd #x0000000000000000))
(simplify (bvashr #x00aa00bb00cc00dd #x0000000000000008))
(simplify (bvashr #x00aa00bb00cc00dd #x0000000000000010))
(simplify (bvashr #x00aa00bb00cc00dd #x0000000000000020))
(simplify (bvashr #x00aa00bb00cc00dd #x0000000000000030))
(simplify (bvashr #x00aa00bb00cc00dd #x000000000000ffff))
(echo "----")
(simplify (bvashr #x80ff #x0004))
(simplify (bvashr #x80ff #x0008))
(simplify (bvashr #x80ff #x0000))
(simplify (bvashr #x80aa00bb00cc00dd #x0000000000000000))
(simplify (bvashr #x80aa00bb00cc00dd #x0000000000000008))
(simplify (bvashr #x80aa00bb00cc00dd #x0000000000000010))
(simplify (bvashr #x80aa00bb00cc00dd #x0000000000000020))
(simplify (bvashr #x80aa00bb00cc00dd #x0000000000000030))
(simplify (bvashr #x80aa00bb00cc00dd #x000000000000ffff))
(echo "----")

(define-sort W () (_ BitVec 16))
(declare-const c1 W)
(declare-const c2 W)
(simplify (bvashr (bvashr c1 #x0002) #x0003))
(simplify (bvashr (bvashr c1 #x0008) #x0009))
(simplify (bvashr c1 #x0000))
(simplify (bvlshr (bvlshr c1 #x0002) #x0003))
(simplify (bvlshr (bvlshr c1 #x0008) #x0009))
(simplify (bvlshr c1 #x0010))
(simplify (bvlshr c1 #x0000))
(simplify (bvshl (bvshl c1 #x0002) #x0003))
(simplify (bvshl (bvshl c1 #x0008) #x0009))
(simplify (bvshl c1 #x0010))
(simplify (bvshl c1 #x0000))

(*--- recorded
all:
  exit: 0
  transcript: |-
    #x0ff0
    #xff00
    #x00ff
    #x00aa00bb00cc00dd
    #xaa00bb00cc00dd00
    #x00bb00cc00dd0000
    #x00cc00dd00000000
    #x00dd000000000000
    #x0000000000000000
    ----
    #x000f
    #x0000
    #x00ff
    #x00aa00bb00cc00dd
    #x0000aa00bb00cc00
    #x000000aa00bb00cc
    #x0000000000aa00bb
    #x00000000000000aa
    #x0000000000000000
    ----
    #x000f
    #x0000
    #x00ff
    #x00aa00bb00cc00dd
    #x0000aa00bb00cc00
    #x000000aa00bb00cc
    #x0000000000aa00bb
    #x00000000000000aa
    #x0000000000000000
    ----
    #xf80f
    #xff80
    #x80ff
    #x80aa00bb00cc00dd
    #xff80aa00bb00cc00
    #xffff80aa00bb00cc
    #xffffffff80aa00bb
    #xffffffffffff80aa
    #xffffffffffffffff
    ----
    (bvashr c1 #x0005)
    (bvashr c1 #x0010)
    c1
    (concat #b00000 ((_ extract 15 5) c1))
    #x0000
    #x0000
    c1
    (concat ((_ extract 10 0) c1) #b00000)
    #x0000
    #x0000
    c1
---*)
