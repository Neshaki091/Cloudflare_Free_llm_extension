import math

def is_prime(n):
    """
    Hàm kiểm tra xem một số có phải là số nguyên tố không.
    """
    if n <= 1:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    
    # Kiểm tra các ước số từ 3 đến căn bậc 2 của n
    for i in range(3, int(math.sqrt(n)) + 1, 2):
        if n % i == 0:
            return False
    return True

def main():
    try:
        # Nhập N từ bàn phím
        N = int(input("Nhập số N: "))
        
        if N < 2:
            print(f"Không có số nguyên tố nào từ 1 đến {N}.")
            return

        primes = []
        # Lặp từ 2 đến N để tìm số nguyên tố
        for i in range(2, N + 1):
            if is_prime(i):
                primes.append(i)
        
        # Hiển thị kết quả
        print(f"Các số nguyên tố từ 1 đến {N} là: {primes}")
        
    except ValueError:
        print("Lỗi: Vui lòng nhập một số nguyên hợp lệ.")

if __name__ == "__main__":
    main()