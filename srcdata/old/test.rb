a = [[1,2]]
a.push([3,4])
puts a.inspect

a = [1, 2, 3]
puts a.flatten.join("::")
a[0,0] = [0]
puts a.flatten.join("::")
a[0] = ['A', 'B', 'C']
puts a.inspect
