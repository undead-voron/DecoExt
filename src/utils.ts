export function callOnce(callback: () => unknown) {
  let wasCalled = false
  return () => {
    if (!wasCalled) {
      wasCalled = true
      callback()
    }
  }
}
